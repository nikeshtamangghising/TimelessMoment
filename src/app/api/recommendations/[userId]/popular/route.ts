import { NextRequest, NextResponse } from 'next/server'
import { RecommendationEngine } from '@/lib/recommendation-engine'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 50)

    const userId = params.userId === 'guest' ? undefined : params.userId

    // Get popular products
    const popular = await RecommendationEngine.getPopularProducts(limit)

    // Fetch full product details
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    const productIds = popular.map(r => r.productId)
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
    
    const result = popular
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
    console.error('Popular recommendations error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch popular recommendations',
        products: [],
        count: 0
      },
      { status: 500 }
    )
  }
}