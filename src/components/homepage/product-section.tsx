'use client'

import Link from 'next/link'
import { Product } from '@/types'
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
  products: Product[]
  viewAllLink?: string
  className?: string
  variant?: 'default' | 'featured' | 'popular' | 'trending'
}

export default function ProductSection({ 
  title, 
  subtitle, 
  products, 
  viewAllLink,
  className = '',
  variant = 'default'
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
    <section className={`py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end mb-16">
          <div className="mb-8 lg:mb-0">
            {getVariantBadge()}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              {title}
              {getVariantIcon()}
            </h2>
            {subtitle && (
              <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="group hidden lg:inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              View All
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <div 
              key={product.id}
              className="transform transition-all duration-500 hover:scale-105"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        {viewAllLink && (
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