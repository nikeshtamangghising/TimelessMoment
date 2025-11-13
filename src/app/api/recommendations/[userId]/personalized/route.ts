import { NextRequest, NextResponse } from 'next/server'
import { RecommendationEngine } from '@/lib/recommendation-engine'
import { db } from '@/lib/db'
import { products, userInterests } from '@/lib/db/schema'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

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

    let productsResult
    let totalCount

    if (!userId || userId === 'guest') {
      // For guest users, show newest products first
      productsResult = await db.select()
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(
          desc(products.createdAt),
          desc(products.popularityScore)
        )
        .limit(limit)
        .offset(offset)

      const totalCountResult = await db.select({
        count: sql<number>`count(*)`
      })
      .from(products)
      .where(eq(products.isActive, true))

      totalCount = totalCountResult[0]?.count || 0
    } else {
      // For logged-in users, get personalized recommendations based on their interests
      const userInterestsResult = await db.select()
        .from(userInterests)
        .where(eq(userInterests.userId, userId))
        .orderBy(desc(userInterests.interestScore))

      // Get products from interested categories first, then others
      const categoryIds = userInterestsResult.map(i => i.categoryId)
      
      if (categoryIds.length > 0) {
        // Get products from interested categories first
        productsResult = await db.select()
          .from(products)
          .where(eq(products.isActive, true))
          .orderBy(
            desc(products.popularityScore),
            desc(products.createdAt)
          )
          .limit(limit)
          .offset(offset)
      } else {
        // Fallback to popular products for users without interests
        productsResult = await db.select()
          .from(products)
          .where(eq(products.isActive, true))
          .orderBy(
            desc(products.popularityScore),
            desc(products.createdAt)
          )
          .limit(limit)
          .offset(offset)
      }

      const totalCountResult = await db.select({
        count: sql<number>`count(*)`
      })
      .from(products)
      .where(eq(products.isActive, true))

      totalCount = totalCountResult[0]?.count || 0
    }

    // Transform to recommendation format
    const result = productsResult.map(product => ({
      productId: product.id,
      score: parseFloat(product.popularityScore || '0'),
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