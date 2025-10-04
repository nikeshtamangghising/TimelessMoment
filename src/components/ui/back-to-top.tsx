'use client'

import { useState, useEffect } from 'react'
import { ChevronUpIcon } from '@heroicons/react/24/outline'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.pageYOffset
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(scrolled / maxScroll, 1) * 100
      
      setScrollProgress(progress)
      setIsVisible(scrolled > 300)
    }

    const debouncedToggleVisibility = debounce(toggleVisibility, 10)
    window.addEventListener('scroll', debouncedToggleVisibility)

    return () => window.removeEventListener('scroll', debouncedToggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Simple debounce function
  function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 group"
          aria-label="Back to top"
        >
          <div className="relative">
            {/* Progress Circle */}
            <svg
              className="w-12 h-12 transform -rotate-90"
              viewBox="0 0 48 48"
            >
              {/* Background circle */}
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollProgress / 100)}`}
                className="transition-all duration-150 ease-out"
              />
            </svg>
            
            {/* Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group-hover:scale-110">
                <ChevronUpIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </button>
      )}
    </>
  )
}