import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
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

    // Get popular products
    const popularProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { popularityScore: 'desc' },
      take: popularLimit,
      select: { id: true, popularityScore: true },
    });

    const popular = popularProducts.map(p => ({
      productId: p.id,
      score: p.popularityScore || 0,
      reason: 'popular' as const,
    }));

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
    const personalized = popular.slice(0, personalizedLimit).map(p => ({ 
      ...p, 
      reason: 'personalized' as const 
    }));

    const recommendations = {
      personalized,
      popular,
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

    return NextResponse.json(result);
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