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
      // Get personalized recommendations for logged-in users
      recommendations = await productRepo.getPersonalizedRecommendations(session.user.id, 8)
    } else {
      // Get general recommendations for anonymous users
      recommendations = await productRepo.getTrendingProducts(8)
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
    console.error('Error fetching recommendations:', error)
    
    performanceMonitor.recordApiLatency('/api/homepage/recommendations', performance.now() - timer, 500)
    
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}