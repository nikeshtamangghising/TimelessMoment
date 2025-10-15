'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ProductWithCategory } from '@/types'
import ProductSection from './product-section'

interface RecommendationData {
  personalized: Array<{
    productId: string;
    score: number;
    reason: string;
    product: ProductWithCategory;
  }>;
  popular: Array<{
    productId: string;
    score: number;
    reason: string;
    product: ProductWithCategory;
  }>;
  trending: Array<{
    productId: string;
    score: number;
    reason: string;
    product: ProductWithCategory;
  }>;
}

export default function RecommendationsSection() {
  const { data: session } = useSession()
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true)
        const userId = session?.user?.id || 'guest'
        const response = await fetch(`/api/recommendations/${userId}?personalizedLimit=8&popularLimit=8&trendingLimit=8`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }
        
        const data = await response.json()
        setRecommendations(data)
      } catch (err) {
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
              {Array.from({ length: 8 }).map((_, index) => (
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

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load recommendations: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!recommendations) {
    return null // Don't show section if no recommendations
  }

  return (
    <>
      {/* Trending Products - Always show */}
      {recommendations.trending.length > 0 && (
        <ProductSection
          title="Trending Now"
          subtitle="Hot products that everyone is talking about"
          products={recommendations.trending.map(r => r.product)}
          viewAllLink="/products?sort=trending"
          className="bg-gradient-to-b from-white to-gray-50"
          variant="trending"
        />
      )}
      
      {/* Personalized Recommendations - Only for logged in users */}
      {session?.user && recommendations.personalized.length > 0 && (
        <ProductSection
          title="Picked For You"
          subtitle="Personalized recommendations based on your preferences"
          products={recommendations.personalized.map(r => r.product)}
          viewAllLink="/products?personalized=true"
          className="bg-gradient-to-b from-gray-50 to-white"
          variant="default"
        />
      )}
      
      {/* Popular Products */}
      {recommendations.popular.length > 0 && (
        <ProductSection
          title="Popular Choices"
          subtitle="Products that customers love the most"
          products={recommendations.popular.map(r => r.product)}
          viewAllLink="/products?sort=popular"
          className="bg-gradient-to-b from-white to-gray-50"
          variant="popular"
        />
      )}
    </>
  )
}