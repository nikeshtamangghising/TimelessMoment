import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import RecommendationEngine from '@/lib/recommendation-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    const personalizedLimit = parseInt(searchParams.get('personalizedLimit') || '12');
    const popularLimit = parseInt(searchParams.get('popularLimit') || '12');
    const trendingLimit = parseInt(searchParams.get('trendingLimit') || '12');

    // Verify user exists (optional check)
    if (userId !== 'guest') {
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

    // Get all recommendations
    const recommendations = await RecommendationEngine.getAllRecommendations(
      userId === 'guest' ? undefined : userId,
      {
        personalized: personalizedLimit,
        popular: popularLimit,
        trending: trendingLimit,
      }
    );

    // Fetch product details for each recommendation type
    const [personalizedProducts, popularProducts, trendingProducts] = await Promise.all([
      fetchProductsByIds(recommendations.personalized.map(r => r.productId)),
      fetchProductsByIds(recommendations.popular.map(r => r.productId)),
      fetchProductsByIds(recommendations.trending.map(r => r.productId)),
    ]);

    // Combine recommendations with product data
    const result = {
      personalized: combineRecommendationsWithProducts(recommendations.personalized, personalizedProducts),
      popular: combineRecommendationsWithProducts(recommendations.popular, popularProducts),
      trending: combineRecommendationsWithProducts(recommendations.trending, trendingProducts),
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