import { NextRequest, NextResponse } from 'next/server'
import { RecommendationEngine } from '@/lib/recommendation-engine'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { desc, eq, notInArray, sql, and } from 'drizzle-orm'

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

    // Get all active products sorted by popularity score - only select essential columns
    const productsResult = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      discountPrice: products.discountPrice,
      currency: products.currency,
      images: products.images,
      inventory: products.inventory,
      isActive: products.isActive,
      popularityScore: products.popularityScore,
      viewCount: products.viewCount,
      categoryId: products.categoryId,
      brandId: products.brandId,
    })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(
        desc(products.popularityScore),
        desc(products.orderCount),
        desc(products.viewCount)
      )
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCountResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(products)
    .where(eq(products.isActive, true))

    const totalCount = totalCountResult[0]?.count || 0

    // Transform to recommendation format
    const result = productsResult.map(product => ({
      productId: product.id,
      score: parseFloat(product.popularityScore || '0'),
      reason: 'popular',
      product
    }))

    if (result.length < limit) {
      const excludeIds = result.map(item => item.productId)
      const fallbackNeeded = limit - result.length
      if (fallbackNeeded > 0) {
        const fallbackProducts = await db.select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          price: products.price,
          discountPrice: products.discountPrice,
          currency: products.currency,
          images: products.images,
          inventory: products.inventory,
          isActive: products.isActive,
          popularityScore: products.popularityScore,
          viewCount: products.viewCount,
          categoryId: products.categoryId,
          brandId: products.brandId,
        })
        .from(products)
        .where(and(
          eq(products.isActive, true),
          excludeIds.length > 0 ? notInArray(products.id, excludeIds) : sql`TRUE`
        ))
        .orderBy(desc(products.createdAt))
        .limit(fallbackNeeded)

        fallbackProducts.forEach(product => {
          result.push({
            productId: product.id,
            score: parseFloat(product.popularityScore || '0'),
            reason: 'popular',
            product,
          })
        })
      }
    }

    const response = NextResponse.json({
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
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response

  } catch (error) {
    console.error('Popular recommendations error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch popular recommendations',
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