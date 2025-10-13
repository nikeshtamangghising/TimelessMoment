'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Product } from '@/types'
import StarRating from './star-rating'
import ReviewForm from './review-form'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'

interface Review {
  id: string
  rating: number
  title?: string
  content: string
  createdAt: string
  helpfulVotes: number
  user?: {
    id: string
    name: string
    image?: string
  }
  guestName?: string
  isVerified: boolean
}

interface ReviewsData {
  reviews: Review[]
  ratingStats: {
    average: number
    count: number
  }
}

interface ProductReviewsProps {
  product: Product
  className?: string
}

export default function ProductReviews({ product, className = '' }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${product.id}/reviews`)
        const data: { success: boolean; data: ReviewsData } = await response.json()
        
        if (data.success) {
          setReviews(data.data.reviews)
          setRatingStats(data.data.ratingStats)
        } else {
          setError('Failed to load reviews')
        }
      } catch (err) {
        console.error('Error fetching reviews:', err)
        setError('Failed to load reviews')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [product.id])

  const handleReviewSubmit = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev])
    setRatingStats(prev => ({
      ...prev,
      count: prev.count + 1
    }))
    setShowReviewForm(false)
  }

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/products/${product.id}/reviews/${reviewId}/helpful`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpfulVotes: review.helpfulVotes + 1 }
            : review
        ))
      }
    } catch (err) {
      console.error('Error voting on review:', err)
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Reviews Summary */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <StarRating rating={ratingStats.average} size="lg" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                {ratingStats.average.toFixed(1)}
              </span>
            </div>
            <div className="text-gray-600">
              <span className="font-medium">{ratingStats.count}</span> reviews
            </div>
          </div>
          
          {session ? (
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </Button>
          ) : (
            <div className="text-sm text-gray-500">
              Please log in to write a review
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        {ratingStats.count > 0 && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter(r => r.rating === rating).length
              const percentage = ratingStats.count > 0 ? (count / ratingStats.count) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 w-8">{rating}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && session && (
        <div className="mb-6">
          <ReviewForm
            productId={product.id}
            onReviewSubmit={handleReviewSubmit}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        {review.user?.image ? (
                          <img
                            src={review.user.image}
                            alt={review.user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {review.user?.name?.[0] || review.guestName?.[0] || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {review.user?.name || review.guestName || 'Anonymous'}
                          </h4>
                          {review.isVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <StarRating rating={review.rating} size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {review.title && (
                      <h5 className="text-lg font-medium text-gray-900 mt-3 mb-2">
                        {review.title}
                      </h5>
                    )}
                    
                    <p className="text-gray-700 leading-relaxed">
                      {review.content}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => handleHelpfulVote(review.id)}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span>Helpful ({review.helpfulVotes})</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
