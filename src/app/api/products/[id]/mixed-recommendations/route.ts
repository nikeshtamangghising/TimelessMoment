import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import RecommendationEngine from '@/lib/recommendation-engine'

interface RouteParams {
  params: Promise<{ id: string }>
}

type RecItem = { productId: string; score: number; reason: 'similar'|'popular'|'trending'|'personalized' }

async function fetchProductsByIds(productIds: string[]) {
  if (productIds.length === 0) return []
  return await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
  })
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
    const similar = await RecommendationEngine.getSimilarProducts(id, limit * 2)

    // 2) Popular now (compute live score for freshness)
    const popularRaw = await prisma.product.findMany({
      where: { isActive: true, id: { not: id } },
      take: limit * 4,
      select: { id: true, viewCount: true, cartCount: true, favoriteCount: true, orderCount: true, createdAt: true },
    })
    const popular = popularRaw.map(p => ({
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

    // 3) Trending (recent activity)
    const trending = await RecommendationEngine.getTrendingProducts(limit * 2)

    // 4) Personalized (optional)
    let personalized: RecItem[] = []
    if (userId && userId !== 'guest') {
      try {
        personalized = (await RecommendationEngine.getPersonalizedRecommendations(userId, limit * 2)) as RecItem[]
      } catch {}
    }

    // Interleave for diversity: personalized, similar, trending, popular
    const mixed = interleaveAndDedup([
      personalized,
      similar as RecItem[],
      trending as RecItem[],
      popular as RecItem[],
    ], id, limit, offset)

    const productIds = mixed.map(m => m.productId)
    const products = await fetchProductsByIds(productIds)
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

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
    console.error('Error fetching mixed recommendations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
