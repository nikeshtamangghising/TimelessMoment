import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import RecommendationEngine from '@/lib/recommendation-engine';
import { products, userActivities, users } from '@/lib/db/schema';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';

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
      const userResult = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Get popular products - compute score on the fly so latest counts are reflected
    // Optimized: Pre-sort by popularityScore to reduce computation
    const popularRaw = await db.select({
      id: products.id,
      viewCount: products.viewCount,
      cartCount: products.cartCount,
      favoriteCount: products.favoriteCount,
      orderCount: products.orderCount,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.popularityScore), desc(products.viewCount))
    .limit(Math.min(popularLimit * 2, 24)); // Reduced from 4x to 2x for faster queries

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

      // Get trending data by grouping user activities
      const trendingData = await db.select({
        productId: userActivities.productId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(userActivities)
      .where(gte(userActivities.createdAt, cutoffDate))
      .groupBy(userActivities.productId)
      .orderBy(desc(sql`count(*)`))
      .limit(trendingLimit);

      const trendingProductIds = trendingData.map(t => t.productId);
      if (trendingProductIds.length > 0) {
        const trendingProducts = await db.select({ 
          id: products.id, 
          popularityScore: products.popularityScore 
        })
        .from(products)
        .where(and(
          inArray(products.id, trendingProductIds),
          eq(products.isActive, true)
        ));

        trending = trendingProducts.map(p => ({
          productId: p.id,
          score: parseFloat(p.popularityScore || '0'),
          reason: 'trending' as const,
        }));
      }
    } catch (error) {
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
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

async function fetchProductsByIds(productIds: string[]) {
  if (productIds.length === 0) return [];

  // Only fetch essential columns for faster queries and smaller payload
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
    ));
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