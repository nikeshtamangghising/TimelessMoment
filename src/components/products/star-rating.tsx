'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StarRating({ 
  rating, 
  interactive = false, 
  onRatingChange,
  size = 'md',
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = (newRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating)
    }
  }

  const handleMouseEnter = (newRating: number) => {
    if (interactive) {
      setHoverRating(newRating)
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
      setIsHovering(false)
    }
  }

  const displayRating = isHovering ? hoverRating : rating

  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= displayRating
        const isHalfFilled = starValue === Math.ceil(displayRating) && displayRating % 1 !== 0

        return (
          <button
            key={index}
            type={interactive ? 'button' : undefined}
            className={`${sizeClasses[size]} ${
              interactive 
                ? 'cursor-pointer hover:scale-110 transition-transform duration-150' 
                : 'cursor-default'
            }`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
          >
            <svg
              className={`w-full h-full ${
                isFilled || isHalfFilled
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
              fill={isFilled ? 'currentColor' : 'none'}
              viewBox="0 0 20 20"
            >
              {isHalfFilled ? (
                <defs>
                  <linearGradient id={`half-${index}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              ) : null}
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                fill={isHalfFilled ? `url(#half-${index})` : 'currentColor'}
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
