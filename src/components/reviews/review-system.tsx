'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

interface Review {
  id: string
  rating: number
  title?: string
  content?: string
  guestName?: string
  guestEmail?: string
  isVerified: boolean
  helpfulVotes: number
  createdAt: string
  user?: {
    name: string
  }
}

interface ReviewSystemProps {
  productId: string
  reviews: Review[]
  averageRating: number
  totalReviews: number
  onReviewSubmit?: () => void
}

interface RatingBreakdown {
  5: number
  4: number
  3: number
  2: number
  1: number
}

export default function ReviewSystem({ 
  productId, 
  reviews, 
  averageRating, 
  totalReviews,
  onReviewSubmit 
}: ReviewSystemProps) {
  const { isAuthenticated } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Calculate rating breakdown
  const ratingBreakdown: RatingBreakdown = reviews.reduce((acc, review) => {
    acc[review.rating as keyof RatingBreakdown]++
    return acc
  }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })

  const getRatingPercentage = (star: number) => {
    return totalReviews > 0 ? (ratingBreakdown[star as keyof RatingBreakdown] / totalReviews) * 100 : 0
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="border-b border-gray-200 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <span className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-6 w-6 ${
                      star <= averageRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-600">Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-900">{star}</span>
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-yellow-400 rounded-full"
                    style={{ width: `${getRatingPercentage(star)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {ratingBreakdown[star as keyof RatingBreakdown]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        <div className="mt-6">
          <Button
            onClick={() => setShowReviewForm(true)}
            className="w-full sm:w-auto"
          >
            Write a Review
          </Button>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          isAuthenticated={isAuthenticated}
          onSubmit={() => {
            setShowReviewForm(false)
            onReviewSubmit?.()
          }}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Review Form Component
interface ReviewFormProps {
  productId: string
  isAuthenticated: boolean
  onSubmit: () => void
  onCancel: () => void
}

function ReviewForm({ productId, isAuthenticated, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title || undefined,
          content: content || undefined,
          guestName: !isAuthenticated ? guestName : undefined,
          guestEmail: !isAuthenticated ? guestEmail : undefined,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit review')
      }

      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1"
              >
                {star <= (hoveredRating || rating) ? (
                  <StarIcon className="h-8 w-8 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="h-8 w-8 text-gray-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Guest Information */}
        {!isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email *
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your review"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Review Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Review (Optional)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Tell others what you think about this product..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Submit Review
          </Button>
        </div>
      </form>
    </div>
  )
}

// Individual Review Item
interface ReviewItemProps {
  review: Review
}

function ReviewItem({ review }: ReviewItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-5 w-5 ${
                    star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {review.user?.name || review.guestName}
            </span>
            {review.isVerified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Verified Purchase
              </span>
            )}
          </div>
          
          {review.title && (
            <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
          )}
          
          {review.content && (
            <p className="text-gray-700 mb-3">{review.content}</p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{formatDate(review.createdAt)}</span>
            {review.helpfulVotes > 0 && (
              <span>{review.helpfulVotes} people found this helpful</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}