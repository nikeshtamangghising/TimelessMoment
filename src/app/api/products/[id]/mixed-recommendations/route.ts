import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq, and, ne, inArray, desc } from 'drizzle-orm'
import RecommendationEngine from '@/lib/recommendation-engine'

interface RouteParams {
  params: Promise<{ id: string }>
}

type RecItem = { productId: string; score: number; reason: 'similar'|'popular'|'trending'|'personalized' }

async function fetchProductsByIds(productIds: string[]) {
  if (productIds.length === 0) return []
  // Optimized: Only fetch essential columns for faster queries
  return await db.select({
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
      inArray(products.id, productIds),
      eq(products.isActive, true)
    ))
}

function interleaveAndDedup(lists: RecItem[][], excludeId: string, limit: number, offset: number) {
  const seen = new Set<string>([excludeId])
  const output: RecItem[] = []
  const maxLength = Math.max(...lists.map(l => l.length))

  for (let i = 0; i < maxLength && output.length < limit + offset; i++) {
    for (const list of lists) {
      const item = list[i]
      if (!item) continue
      if (seen.has(item.productId)) continue
      seen.add(item.productId)
      output.push(item)
      if (output.length >= limit + offset) break
    }
  }

  // Apply offset
  return output.slice(offset, offset + limit)
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10) || 12, 48)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    // 1) Similar products (category + price proximity)
    let similar: RecItem[] = []
    try {
      similar = await RecommendationEngine.getSimilarProducts(id, limit * 2) as RecItem[]
    } catch (error) {
      console.error('Error fetching similar products:', error)
    }

    // 2) Popular now (compute live score for freshness)
    let popular: RecItem[] = []
    try {
      // Optimized: Pre-sort and reduce limit for faster queries
      const popularRaw = await db.select({
        id: products.id,
        viewCount: products.viewCount,
        cartCount: products.cartCount,
        favoriteCount: products.favoriteCount,
        orderCount: products.orderCount,
        createdAt: products.createdAt
      })
        .from(products)
        .where(and(eq(products.isActive, true), ne(products.id, id)))
        .orderBy(desc(products.popularityScore), desc(products.viewCount))
        .limit(Math.min(limit * 2, 16)) // Reduced from 4x to 2x for faster queries
      
      popular = popularRaw.map(p => ({
        productId: p.id,
        score: RecommendationEngine.calculatePopularityScore({
          viewCount: p.viewCount || 0,
          cartCount: p.cartCount || 0,
          favoriteCount: p.favoriteCount || 0,
          orderCount: p.orderCount || 0,
          createdAt: p.createdAt,
        }),
        reason: 'popular' as const,
      })).sort((a, b) => b.score - a.score).slice(0, limit * 2)
    } catch (error) {
      console.error('Error fetching popular products:', error)
    }

    // 3) Trending (recent activity)
    let trending: RecItem[] = []
    try {
      trending = await RecommendationEngine.getTrendingProducts(limit * 2) as RecItem[]
    } catch (error) {
      console.error('Error fetching trending products:', error)
    }

    // 4) Personalized (optional)
    let personalized: RecItem[] = []
    if (userId && userId !== 'guest') {
      try {
        personalized = (await RecommendationEngine.getPersonalizedRecommendations(userId, limit * 2)) as RecItem[]
      } catch (error) {
        console.error('Error fetching personalized products:', error)
      }
    }

    // Interleave for diversity: personalized, similar, trending, popular
    const mixed = interleaveAndDedup([
      personalized,
      similar as RecItem[],
      trending as RecItem[],
      popular as RecItem[],
    ], id, limit, offset)

    // If no recommendations found, return empty result
    if (mixed.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      })
    }

    const productIds = mixed.map(m => m.productId).filter(id => id)
    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      })
    }

    const productsData = await fetchProductsByIds(productIds)
    const productMap = Object.fromEntries(productsData.map(p => [p.id, p]))

    const result = mixed
      .map(item => ({ ...item, product: productMap[item.productId] }))
      .filter(item => !!item.product)

    const res = NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    })
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
    return res
  } catch (error) {
    console.error('Error in mixed-recommendations:', error)
    const res = NextResponse.json({
      success: true,
      data: [],
      count: 0,
    })
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
    return res
  }
}
