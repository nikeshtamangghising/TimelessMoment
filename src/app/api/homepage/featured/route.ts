import { NextRequest, NextResponse } from 'next/server'
import { getProductRepository } from '@/lib/product-repository'
import { performanceMonitor } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  const timer = performance.now()
  
  try {
    const productRepo = getProductRepository()
    
    // Get featured products (popular, new arrivals, etc.)
    const [
      featuredProducts,
      popularProducts,
      newArrivals,
      categories
    ] = await Promise.all([
      productRepo.getFeaturedProducts(8),
      productRepo.getPopularProducts(6),
      productRepo.getNewArrivals(6),
      productRepo.getCategories()
    ])

    const response = {
      featured: featuredProducts,
      popular: popularProducts,
      newArrivals: newArrivals,
      categories: categories.slice(0, 8), // Limit to 8 categories for homepage
    }

    // Record performance metric
    performanceMonitor.recordApiLatency('/api/homepage/featured', performance.now() - timer, 200)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    
    performanceMonitor.recordApiLatency('/api/homepage/featured', performance.now() - timer, 500)
    
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    )
  }
}