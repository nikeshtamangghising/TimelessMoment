'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Product } from '@/types'
import ProductSection from './product-section'

export default function RecommendationsSection() {
  const { data: session } = useSession()
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true)
        const response = await fetch('/api/homepage/recommendations')
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }
        
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [session]) // Refetch when session changes

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-96 mx-auto mb-8"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-300 rounded-lg h-64 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error || recommendations.length === 0) {
    return null // Don't show section if there's an error or no recommendations
  }

  const title = session?.user ? 'For You' : 'Trending Now'
  const subtitle = session?.user 
    ? 'Personalized recommendations based on your preferences'
    : 'Popular products that others are loving'
  const variant = session?.user ? 'default' : 'trending'

  return (
    <ProductSection
      title={title}
      subtitle={subtitle}
      products={recommendations}
      viewAllLink="/products"
      className="bg-gradient-to-b from-white to-gray-50"
      variant={variant}
    />
  )
}