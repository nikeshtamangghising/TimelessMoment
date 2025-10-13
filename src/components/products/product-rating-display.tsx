'use client'

import { useState, useEffect } from 'react'
import StarRating from './star-rating'

interface ProductRatingDisplayProps {
  productId: string
  className?: string
}

interface RatingStats {
  average: number
  count: number
}

export default function ProductRatingDisplay({ productId, className = '' }: ProductRatingDisplayProps) {
  const [ratingStats, setRatingStats] = useState<RatingStats>({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRatingStats = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/reviews`)
        const data = await response.json()
        
        if (data.success) {
          setRatingStats(data.data.ratingStats)
        }
      } catch (error) {
        console.error('Error fetching rating stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRatingStats()
  }, [productId])

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (ratingStats.count === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        <StarRating rating={ratingStats.average} size="sm" />
        <span className="text-sm font-medium text-gray-900">
          {ratingStats.average.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">
          ({ratingStats.count} {ratingStats.count === 1 ? 'Review' : 'Reviews'})
        </span>
      </div>
    </div>
  )
}
