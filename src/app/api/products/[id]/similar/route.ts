import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import RecommendationEngine from '@/lib/recommendation-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '12');

    // Verify product exists
    const productResult = await db.query.products.findFirst({
      where: eq(products.id, id),
      columns: {
        id: true,
        isActive: true,
        name: true
      },
      with: {
        category: {
          columns: {
            name: true
          }
        }
      }
    });

    if (!productResult) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!productResult.isActive) {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 }
      );
    }

    // Get similar products
    const similarRecommendations = await RecommendationEngine.getSimilarProducts(id, limit);

    // Fetch full product details
    const productIds = similarRecommendations.map(r => r.productId);
    const similarProducts = await db.query.products.findMany({
      where: and(
        inArray(products.id, productIds),
        eq(products.isActive, true)
      ),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true
          }
        },
        brand: {
          columns: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
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
      productName: productResult.name,
      category: productResult.category?.name || '',
      similar: result,
      count: result.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch similar products' },
      { status: 500 }
    );
  }
}