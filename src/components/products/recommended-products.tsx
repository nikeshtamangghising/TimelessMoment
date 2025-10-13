'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'

interface RecommendedProductsProps {
  productId: string
  className?: string
}

interface RecommendationData {
  success: boolean
  data: Product[]
}

export default function RecommendedProducts({ productId, className = '' }: RecommendedProductsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${productId}/recommendations`)
        const data: RecommendationData = await response.json()
        
        if (data.success) {
          setRecommendations(data.data)
        } else {
          setError('Failed to load recommendations')
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError('Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [productId])

  if (loading) {
    return (
      <div className={`${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || recommendations.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg">
              <Image
                src={product.images[0] || '/placeholder-product.jpg'}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2">
                {product.name}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xl font-bold text-indigo-600">
                  ${product.price.toFixed(2)}
                </span>
                {product.ratingAvg && product.ratingCount > 0 && (
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.ratingAvg || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1 text-sm text-gray-600">
                      ({product.ratingCount})
                    </span>
                  </div>
                )}
              </div>
              {product.inventory <= (product.lowStockThreshold || 5) && product.inventory > 0 && (
                <div className="mt-2 text-sm text-yellow-600">
                  Only {product.inventory} left in stock
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
