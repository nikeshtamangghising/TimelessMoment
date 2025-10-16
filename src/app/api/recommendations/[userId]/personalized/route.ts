import { NextRequest, NextResponse } from 'next/server'
import { RecommendationEngine } from '@/lib/recommendation-engine'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 50)

    const resolvedParams = await params
    const userId = resolvedParams.userId === 'guest' ? undefined : resolvedParams.userId

    // Return empty for guest users
    if (!userId || userId === 'guest') {
      return NextResponse.json({
        success: true,
        products: [],
        count: 0
      })
    }

    // Get personalized recommendations
    const personalized = await RecommendationEngine.getPersonalizedRecommendations(userId, limit)

    // Fetch full product details
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const productIds = personalized.map(r => r.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      },
      include: {
        category: true,
        brand: true
      }
    })

    // Combine recommendations with product data
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))
    
    const result = personalized
      .filter(rec => productMap[rec.productId])
      .map(rec => ({
        ...rec,
        product: productMap[rec.productId]
      }))

    return NextResponse.json({
      success: true,
      products: result,
      count: result.length
    })

  } catch (error) {
    console.error('Personalized recommendations error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch personalized recommendations',
        products: [],
        count: 0
      },
      { status: 500 }
    )
  }
}