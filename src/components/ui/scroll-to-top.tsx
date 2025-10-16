'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'

export default function ScrollToTop() {
  const { isVisible, scrollToTop } = useScrollToTop()
  const pathname = usePathname()
  
  // Check if we're on a product page
  const isProductPage = pathname.startsWith('/products/') && pathname !== '/products'

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`fixed z-40 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-fade-in ${
            isProductPage 
              ? 'bottom-48 right-4 md:bottom-8 md:right-8' // Much higher on mobile product pages, normal on desktop
              : 'bottom-8 right-8' // Normal position on other pages
          }`}
          aria-label="Scroll to top"
        >
          <ChevronUpIcon className="w-6 h-6" />
        </button>
      )}
    </>
  )
}