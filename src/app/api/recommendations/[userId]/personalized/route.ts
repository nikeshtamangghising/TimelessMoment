import { NextRequest, NextResponse } from 'next/server'
import { RecommendationEngine } from '@/lib/recommendation-engine'

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

    let products
    let totalCount

    if (!userId || userId === 'guest') {
      // For guest users, show newest products first
      products = await prisma.product.findMany({
        where: {
          isActive: true
        },
        include: {
          category: true,
          brand: true
        },
        orderBy: [
          {
            createdAt: 'desc'
          },
          {
            popularityScore: 'desc'
          }
        ],
        skip: offset,
        take: limit
      })

      totalCount = await prisma.product.count({
        where: {
          isActive: true
        }
      })
    } else {
      // For logged-in users, get personalized recommendations based on their interests
      const userInterests = await prisma.userInterest.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { interestScore: 'desc' }
      })

      // Get products from interested categories first, then others
      const categoryIds = userInterests.map(i => i.categoryId)
      
      if (categoryIds.length > 0) {
        // Get products from interested categories first
        products = await prisma.product.findMany({
          where: {
            isActive: true
          },
          include: {
            category: true,
            brand: true
          },
          orderBy: [
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
      } else {
        // Fallback to popular products for users without interests
        products = await prisma.product.findMany({
          where: {
            isActive: true
          },
          include: {
            category: true,
            brand: true
          },
          orderBy: [
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
      }

      totalCount = await prisma.product.count({
        where: {
          isActive: true
        }
      })
    }

    // Transform to recommendation format
    const result = products.map(product => ({
      productId: product.id,
      score: product.popularityScore,
      reason: 'personalized',
      product
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
    console.error('Personalized recommendations error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch personalized recommendations',
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