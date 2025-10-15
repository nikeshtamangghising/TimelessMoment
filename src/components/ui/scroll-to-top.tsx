'use client'

import React from 'react'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'

export default function ScrollToTop() {
  const { isVisible, scrollToTop } = useScrollToTop()

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-fade-in"
          aria-label="Scroll to top"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}
    </>
  )
}