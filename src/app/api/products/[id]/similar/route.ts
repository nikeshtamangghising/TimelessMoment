import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import RecommendationEngine from '@/lib/recommendation-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '12');

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { 
        id: true, 
        isActive: true,
        name: true,
        category: { select: { name: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 }
      );
    }

    // Get similar products
    const similarRecommendations = await RecommendationEngine.getSimilarProducts(id, limit);

    // Fetch full product details
    const productIds = similarRecommendations.map(r => r.productId);
    const similarProducts = await prisma.product.findMany({
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

    // Combine recommendations with product data
    const productMap = Object.fromEntries(similarProducts.map(p => [p.id, p]));
    
    const result = similarRecommendations
      .map(rec => ({
        ...rec,
        product: productMap[rec.productId],
      }))
      .filter(rec => rec.product);

    return NextResponse.json({
      productId: id,
      productName: product.name,
      category: product.category.name,
      similar: result,
      count: result.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching similar products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar products' },
      { status: 500 }
    );
  }
}