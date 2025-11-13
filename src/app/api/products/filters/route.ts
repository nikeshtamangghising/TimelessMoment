import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories, brands, products } from '@/lib/db/schema'
import { eq, and, sql, asc, isNotNull, gt, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get unique categories from active products
    const categoriesResult = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      columns: {
        id: true,
        name: true,
        slug: true
      },
      with: {
        products: {
          where: eq(products.isActive, true),
          columns: { id: true }
        }
      },
      orderBy: asc(categories.name)
    })

    // Get unique brands from active products
    const brandsResult = await db.query.brands.findMany({
      where: eq(brands.isActive, true),
      columns: {
        id: true,
        name: true,
        slug: true
      },
      with: {
        products: {
          where: eq(products.isActive, true),
          columns: { id: true }
        }
      },
      orderBy: asc(brands.name)
    })

    // Get price range from active products
    const [minResult, maxResult] = await Promise.all([
      db.select({ min: sql<number>`min(${products.price})` })
        .from(products)
        .where(eq(products.isActive, true)),
      db.select({ max: sql<number>`max(${products.price})` })
        .from(products)
        .where(eq(products.isActive, true))
    ])

    const priceRange = {
      _min: { price: parseFloat(minResult[0]?.min?.toString() || '0') },
      _max: { price: parseFloat(maxResult[0]?.max?.toString() || '1000') }
    }

    // Get available tags
    const tagsResult = await db.select({ tags: products.tags })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.tags} IS NOT NULL AND array_length(${products.tags}, 1) > 0`
        )
      )

    // Flatten and deduplicate tags
    const allTags = tagsResult.flatMap(product => product.tags || [])
    const uniqueTags = [...new Set(allTags)].sort()

    // Get rating distribution (using raw SQL for groupBy)
    const ratingDistributionResult = await db.execute(sql`
      SELECT ${products.ratingAvg} as rating_avg, COUNT(*) as count
      FROM ${products}
      WHERE ${products.isActive} = true 
        AND ${products.ratingAvg} IS NOT NULL 
        AND ${products.ratingAvg} > 0
      GROUP BY ${products.ratingAvg}
      ORDER BY ${products.ratingAvg} DESC
    `) as Array<{ rating_avg: string; count: string }>

    const ratingDistribution = ratingDistributionResult.map(r => ({
      ratingAvg: parseFloat(r.rating_avg),
      _count: parseInt(r.count, 10)
    }))

    const filters = {
      categories: categoriesResult
        .filter(cat => cat.products && cat.products.length > 0)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productCount: cat.products?.length || 0
        })),
      brands: brandsResult
        .filter(brand => brand.products && brand.products.length > 0)
        .map(brand => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          productCount: brand.products?.length || 0
        })),
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 1000
      },
      tags: uniqueTags,
      ratings: [
        { value: 4, label: '4+ stars', count: ratingDistribution.filter(r => r.ratingAvg && r.ratingAvg >= 4).reduce((sum, r) => sum + r._count, 0) },
        { value: 3, label: '3+ stars', count: ratingDistribution.filter(r => r.ratingAvg && r.ratingAvg >= 3).reduce((sum, r) => sum + r._count, 0) },
        { value: 2, label: '2+ stars', count: ratingDistribution.filter(r => r.ratingAvg && r.ratingAvg >= 2).reduce((sum, r) => sum + r._count, 0) },
        { value: 1, label: '1+ stars', count: ratingDistribution.filter(r => r.ratingAvg && r.ratingAvg >= 1).reduce((sum, r) => sum + r._count, 0) }
      ]
    }

    return NextResponse.json(filters, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product filters' },
      { status: 500 }
    )
  }
}