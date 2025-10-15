import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import RecommendationEngine from '@/lib/recommendation-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    const personalizedLimit = parseInt(searchParams.get('personalizedLimit') || '12');
    const popularLimit = parseInt(searchParams.get('popularLimit') || '12');
    const trendingLimit = parseInt(searchParams.get('trendingLimit') || '12');

    // Verify user exists (only for non-guest users)
    if (userId && userId !== 'guest') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Get popular products - compute score on the fly so latest counts are reflected
    const popularRaw = await prisma.product.findMany({
      where: { isActive: true },
      take: popularLimit * 4, // fetch more then rank by computed score
      select: {
        id: true,
        viewCount: true,
        cartCount: true,
        favoriteCount: true,
        orderCount: true,
        createdAt: true,
      },
    })

    const popularScored = popularRaw.map(p => ({
      productId: p.id,
      score: RecommendationEngine.calculatePopularityScore({
        viewCount: p.viewCount || 0,
        cartCount: p.cartCount || 0,
        favoriteCount: p.favoriteCount || 0,
        orderCount: p.orderCount || 0,
        createdAt: p.createdAt,
      }),
      reason: 'popular' as const,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, popularLimit)

    // Get trending products (recent activity)
    let trending = [];
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const trendingData = await prisma.userActivity.groupBy({
        by: ['productId'],
        where: {
          createdAt: { gte: cutoffDate },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: trendingLimit,
      });

      const trendingProductIds = trendingData.map(t => t.productId);
      const trendingProducts = await prisma.product.findMany({
        where: {
          id: { in: trendingProductIds },
          isActive: true,
        },
        select: { id: true, popularityScore: true },
      });

      trending = trendingProducts.map(p => ({
        productId: p.id,
        score: p.popularityScore || 0,
        reason: 'trending' as const,
      }));
    } catch (error) {
      console.log('No trending data available, using empty array');
      trending = [];
    }

    // For personalized, use popular products as fallback for guest users
    let personalized = [] as Array<{ productId: string; score: number; reason: 'personalized' }>
    if (userId && userId !== 'guest') {
      try {
        const personalizedScores = await RecommendationEngine.getPersonalizedRecommendations(userId, personalizedLimit)
        personalized = personalizedScores.map(p => ({ ...p, reason: 'personalized' as const }))
      } catch (e) {
        // Fallback to popular if personalized fails for any reason
        personalized = popularScored.slice(0, personalizedLimit).map(p => ({ ...p, reason: 'personalized' as const }))
      }
    } else {
      // Guest fallback
      personalized = popularScored.slice(0, personalizedLimit).map(p => ({ ...p, reason: 'personalized' as const }))
    }

    const recommendations = {
      personalized,
      popular: popularScored,
      trending,
    };

    // Fetch product details for each recommendation type
    const [personalizedProducts, popularProductsDetails, trendingProductsDetails] = await Promise.all([
      fetchProductsByIds(recommendations.personalized.map(r => r.productId)),
      fetchProductsByIds(recommendations.popular.map(r => r.productId)),
      fetchProductsByIds(recommendations.trending.map(r => r.productId)),
    ]);

    // Combine recommendations with product data
    const result = {
      personalized: combineRecommendationsWithProducts(recommendations.personalized, personalizedProducts),
      popular: combineRecommendationsWithProducts(recommendations.popular, popularProductsDetails),
      trending: combineRecommendationsWithProducts(recommendations.trending, trendingProductsDetails),
      userId: userId === 'guest' ? null : userId,
      generatedAt: new Date().toISOString(),
    };

    const res = NextResponse.json(result)
    // Cache API responses briefly at the edge/CDN; clients can still SWR
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
    return res;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

async function fetchProductsByIds(productIds: string[]) {
  if (productIds.length === 0) return [];

  return await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      brand: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

function combineRecommendationsWithProducts(recommendations: any[], products: any[]) {
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  
  return recommendations
    .map(rec => ({
      ...rec,
      product: productMap[rec.productId],
    }))
    .filter(rec => rec.product); // Filter out products that weren't found
}