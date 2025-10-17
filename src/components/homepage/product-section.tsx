'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProductWithCategory } from '@/types'
import ProductCard from '@/components/products/product-card'

// Inline SVG icons to avoid import issues
const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const FireIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
)

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
  </svg>
)

interface ProductSectionProps {
  title: string
  subtitle?: string
  products: ProductWithCategory[]
  viewAllLink?: string
  className?: string
  variant?: 'default' | 'featured' | 'popular' | 'trending'
  compact?: boolean
}

export default function ProductSection({ 
  title, 
  subtitle, 
  products, 
  viewAllLink,
  className = '',
  variant = 'default',
  compact = false
}: ProductSectionProps) {


  if (products.length === 0) {
    return null
  }



  const getVariantIcon = () => {
    switch (variant) {
      case 'featured':
        return <StarIcon className="w-5 h-5 text-yellow-500" />
      case 'popular':
        return <FireIcon className="w-5 h-5 text-red-500" />
      case 'trending':
        return <SparklesIcon className="w-5 h-5 text-purple-500" />
      default:
        return null
    }
  }

  const getVariantBadge = () => {
    switch (variant) {
      case 'featured':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
            <StarIcon className="w-4 h-4 mr-1" />
            Featured Collection
          </div>
        )
      case 'popular':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-4">
            <FireIcon className="w-4 h-4 mr-1" />
            Popular Choices
          </div>
        )
      case 'trending':
        return (
          <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-4">
            <SparklesIcon className="w-4 h-4 mr-1" />
            Trending Now
          </div>
        )
      default:
        return null
    }
  }

  return (
    <section className={compact ? `py-3 ${className}` : `py-20 ${className}`}>
      <div className={compact ? "max-w-full mx-auto px-2 sm:px-3 lg:px-4" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        <div className={compact ? "flex flex-col lg:flex-row lg:justify-between lg:items-end mb-2" : "flex flex-col lg:flex-row lg:justify-between lg:items-end mb-16"}>
          <div className={compact ? "mb-2 lg:mb-0" : "mb-8 lg:mb-0"}>
            {!compact && getVariantBadge()}
            <h2 className={compact ? "text-lg md:text-xl font-bold text-gray-900 mb-0.5 flex items-center gap-2" : "text-4xl md:text-5xl font-bold text-gray-900 mb-4 flex items-center gap-3"}>
              {title}
              {!compact && getVariantIcon()}
            </h2>
            {subtitle && !compact && (
              <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className={compact 
                ? "group hidden lg:inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                : "group hidden lg:inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              }
            >
              {compact ? 'More' : 'View All'}
              <svg className={compact ? "ml-1 w-3 h-3" : "ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Products Grid */}
        <div className={compact 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3"
          : "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8"
        }>
          {products.map((product, index) => (
            <div 
              key={product.id}
              className={compact ? "" : "transform transition-all duration-500 hover:scale-105"}
              style={compact ? undefined : {
                animationDelay: `${index * 100}ms`,
              }}
            >
              <ProductCard 
                product={product} 

                compact={compact}
              />
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        {viewAllLink && !compact && (
          <div className="text-center mt-16 lg:hidden">
            <Link
              href={viewAllLink}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              View All Products
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>

    </section>
  )
}
