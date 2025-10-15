import React from 'react'

export default function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square w-full bg-gray-300 rounded-lg"></div>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-300 rounded-md"></div>
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2">
            <div className="h-4 w-16 bg-gray-300 rounded"></div>
            <div className="h-4 w-1 bg-gray-300"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
            <div className="h-4 w-1 bg-gray-300"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
            <div className="h-6 w-1/2 bg-gray-300 rounded"></div>
          </div>

          {/* Price */}
          <div className="h-20 w-full bg-gray-200 rounded-lg"></div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
            <div className="h-4 w-full bg-gray-300 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
            <div className="h-4 w-4/5 bg-gray-300 rounded"></div>
          </div>

          {/* Stock Info */}
          <div className="h-32 w-full bg-gray-200 rounded-lg"></div>

          {/* Add to Cart */}
          <div className="h-12 w-full bg-gray-300 rounded"></div>

          {/* Trust Badges */}
          <div className="h-24 w-full bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="mt-12 space-y-4">
        <div className="flex space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-20 bg-gray-300 rounded"></div>
          ))}
        </div>
        <div className="h-48 w-full bg-gray-200 rounded-lg"></div>
      </div>

      {/* Recommended Products Skeleton */}
      <div className="mt-12 space-y-4">
        <div className="h-8 w-48 bg-gray-300 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square bg-gray-300 rounded-lg"></div>
              <div className="h-4 w-full bg-gray-300 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}