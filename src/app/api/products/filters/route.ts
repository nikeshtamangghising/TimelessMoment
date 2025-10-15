import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get unique categories from active products
    const categories = await prisma.category.findMany({
      where: { 
        isActive: true,
        products: {
          some: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get unique brands from active products
    const brands = await prisma.brand.findMany({
      where: { 
        isActive: true,
        products: {
          some: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get price range from active products
    const priceRange = await prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true }
    })

    // Get available tags
    const tagsResult = await prisma.product.findMany({
      where: { 
        isActive: true,
        tags: {
          isEmpty: false
        }
      },
      select: {
        tags: true
      }
    })

    // Flatten and deduplicate tags
    const allTags = tagsResult.flatMap(product => product.tags)
    const uniqueTags = [...new Set(allTags)].sort()

    // Get rating distribution
    const ratingDistribution = await prisma.product.groupBy({
      by: ['ratingAvg'],
      where: { 
        isActive: true,
        ratingAvg: {
          not: null,
          gt: 0
        }
      },
      _count: true,
      orderBy: {
        ratingAvg: 'desc'
      }
    })

    const filters = {
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: cat._count.products
      })),
      brands: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        productCount: brand._count.products
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