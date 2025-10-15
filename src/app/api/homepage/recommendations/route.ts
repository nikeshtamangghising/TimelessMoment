import { NextRequest, NextResponse } from 'next/server'
import { getProductRepository } from '@/lib/product-repository'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performanceMonitor } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  const timer = performance.now()
  
  try {
    const session = await getServerSession(authOptions)
    const productRepo = getProductRepository()
    
    let recommendations = []
    
    if (session?.user?.id) {
      // Get featured products for logged-in users (simplified personalization)
      recommendations = await productRepo.getFeaturedProducts(8)
    } else {
      // Get popular products for anonymous users
      recommendations = await productRepo.getPopularProducts(8)
    }

    // Record performance metric
    performanceMonitor.recordApiLatency('/api/homepage/recommendations', performance.now() - timer, 200)

    return NextResponse.json({ recommendations }, {
      headers: {
        'Cache-Control': session?.user?.id 
          ? 'private, max-age=300' // Personalized content - shorter cache
          : 'public, s-maxage=600, stale-while-revalidate=1200', // General content - longer cache
      },
    })
  } catch (error) {
    
    performanceMonitor.recordApiLatency('/api/homepage/recommendations', performance.now() - timer, 500)
    
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}