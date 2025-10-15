'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import StarRating from './star-rating'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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

interface ReviewFormProps {
  productId: string
  onReviewSubmit: (review: Review) => void
  onCancel: () => void
  className?: string
}

export default function ReviewForm({ 
  productId, 
  onReviewSubmit, 
  onCancel, 
  className = '' 
}: ReviewFormProps) {
  const { data: session } = useSession()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!content.trim()) {
      setError('Please write a review')
      return
    }

    if (!session && (!guestName.trim() || !guestEmail.trim())) {
      setError('Please provide your name and email')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
          ...(session ? {} : {
            guestName: guestName.trim(),
            guestEmail: guestEmail.trim()
          })
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Create a review object for immediate display
        const newReview: Review = {
          id: data.data.id,
          rating: data.data.rating,
          title: data.data.title,
          content: data.data.content,
          createdAt: data.data.createdAt,
          helpfulVotes: data.data.helpfulVotes,
          user: data.data.user,
          guestName: data.data.guestName,
          isVerified: data.data.isVerified
        }

        onReviewSubmit(newReview)
        
        // Reset form
        setRating(0)
        setTitle('')
        setContent('')
        setGuestName('')
        setGuestEmail('')
      } else {
        setError(data.error || 'Failed to submit review')
      }
    } catch (err) {
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <StarRating
              rating={rating}
              interactive={true}
              onRatingChange={setRating}
              size="lg"
            />
          </div>

          {/* Guest Information (only for non-logged in users) */}
          {!session && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email *
                </label>
                <input
                  type="email"
                  id="guestEmail"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
          )}

          {/* Review Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Review Title (Optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Summarize your review"
              maxLength={255}
            />
          </div>

          {/* Review Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Your Review *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Tell us about your experience with this product..."
              maxLength={2000}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {content.length}/2000 characters
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || rating === 0 || !content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
