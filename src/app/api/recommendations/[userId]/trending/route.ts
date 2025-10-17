import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
    const offset = (page - 1) * limit

    const resolvedParams = await params
    const userId = resolvedParams.userId === 'guest' ? undefined : resolvedParams.userId

    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    // Get trending products based on recent activity (last 7 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    // Get all active products with trending score calculation
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true,
        brand: true,
        _count: {
          select: {
            activities: {
              where: {
                createdAt: { gte: cutoffDate }
              }
            }
          }
        }
      },
      orderBy: [
        {
          activities: {
            _count: 'desc'
          }
        },
        {
          popularityScore: 'desc'
        },
        {
          createdAt: 'desc'
        }
      ],
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: {
        isActive: true
      }
    })

    // Transform to recommendation format
    const result = products.map(product => ({
      productId: product.id,
      score: product._count.activities * 1.5 + product.popularityScore, // Trending boost
      reason: 'trending',
      product: {
        ...product,
        _count: undefined // Remove the count from the product object
      }
    }))

    return NextResponse.json({
      success: true,
      products: result,
      total: totalCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Trending recommendations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending recommendations',
        products: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 12,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      { status: 500 }
    )
  }
}