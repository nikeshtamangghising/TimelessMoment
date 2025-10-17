'use client'

import { useState } from 'react'
import ProductCard from '@/components/products/product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'

// Mock product data for demonstration (simplified for demo)
const mockProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    discountPrice: 199.99,
    currency: 'USD',
    images: ['/api/placeholder/400/400'],
    inventory: 15,
    isNewArrival: true,
    category: { 
      id: '1', 
      name: 'Electronics', 
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      metaTitle: 'Electronics',
      metaDescription: 'Electronic products',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: '',
      image: '',
      sortOrder: 1
    },
    slug: 'premium-wireless-headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    shortDescription: 'Premium audio experience',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    price: 49.99,
    currency: 'USD',
    images: ['/api/placeholder/400/400'],
    inventory: 3,
    isNewArrival: false,
    category: { 
      id: '2', 
      name: 'Clothing', 
      slug: 'clothing',
      description: 'Fashion and apparel',
      metaTitle: 'Clothing',
      metaDescription: 'Fashion products',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: '',
      image: '',
      sortOrder: 2
    },
    slug: 'organic-cotton-t-shirt',
    description: 'Comfortable organic cotton t-shirt',
    shortDescription: 'Sustainable fashion',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Smart Fitness Watch',
    price: 399.99,
    discountPrice: 299.99,
    currency: 'USD',
    images: ['/api/placeholder/400/400'],
    inventory: 0,
    isNewArrival: false,
    category: { 
      id: '3', 
      name: 'Wearables', 
      slug: 'wearables',
      description: 'Wearable technology',
      metaTitle: 'Wearables',
      metaDescription: 'Wearable tech products',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: '',
      image: '',
      sortOrder: 3
    },
    slug: 'smart-fitness-watch',
    description: 'Advanced fitness tracking watch',
    shortDescription: 'Track your fitness goals',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function ProductCardShowcase() {
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [compactMode, setCompactMode] = useState(false)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Enhanced Product Cards
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Showcasing the improved UI/UX with responsive design, better animations, 
          and enhanced user interactions across all device sizes.
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showSkeleton ? 'Show Products' : 'Show Loading State'}
        </button>
        <button
          onClick={() => setCompactMode(!compactMode)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {compactMode ? 'Regular Mode' : 'Compact Mode'}
        </button>
      </div>

      {/* Responsive Grid Demonstration */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 text-center">
          Responsive Grid Layout
        </h2>
        <p className="text-center text-gray-600">
          Resize your browser to see the responsive behavior
        </p>
        
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {showSkeleton ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : (
            mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product as any}
                compact={compactMode}

              />
            ))
          )}
        </div>
      </div>

      {/* Features Showcase */}
      <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 text-center">
          Key Improvements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-3">🎨</div>
            <h3 className="font-semibold text-gray-900 mb-2">Enhanced Visual Design</h3>
            <p className="text-gray-600 text-sm">
              Modern rounded corners, improved shadows, gradient buttons, and better color schemes.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-900 mb-2">Responsive Layout</h3>
            <p className="text-gray-600 text-sm">
              Optimized for all screen sizes with 7 responsive breakpoints from mobile to desktop.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Better UX</h3>
            <p className="text-gray-600 text-sm">
              Improved interactions, loading states, accessibility, and touch-friendly design.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-3">🎭</div>
            <h3 className="font-semibold text-gray-900 mb-2">Smooth Animations</h3>
            <p className="text-gray-600 text-sm">
              Elegant hover effects, loading animations, and micro-interactions for better engagement.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-3">♿</div>
            <h3 className="font-semibold text-gray-900 mb-2">Accessibility</h3>
            <p className="text-gray-600 text-sm">
              Enhanced keyboard navigation, screen reader support, and improved focus management.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl mb-3">🚀</div>
            <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
            <p className="text-gray-600 text-sm">
              Optimized images, efficient animations, and improved loading states for better performance.
            </p>
          </div>
        </div>
      </div>

      {/* Breakpoint Information */}
      <div className="bg-blue-50 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Responsive Breakpoints
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Device</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Breakpoint</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Columns</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Gap</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4">Mobile</td>
                <td className="py-3 px-4">&lt; 475px</td>
                <td className="py-3 px-4">1</td>
                <td className="py-3 px-4">4</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4">Extra Small</td>
                <td className="py-3 px-4">475px+</td>
                <td className="py-3 px-4">2</td>
                <td className="py-3 px-4">4</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4">Small</td>
                <td className="py-3 px-4">640px+</td>
                <td className="py-3 px-4">3</td>
                <td className="py-3 px-4">6</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4">Medium</td>
                <td className="py-3 px-4">768px+</td>
                <td className="py-3 px-4">4</td>
                <td className="py-3 px-4">6</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4">Large</td>
                <td className="py-3 px-4">1024px+</td>
                <td className="py-3 px-4">5</td>
                <td className="py-3 px-4">8</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-3 px-4">Extra Large</td>
                <td className="py-3 px-4">1280px+</td>
                <td className="py-3 px-4">6</td>
                <td className="py-3 px-4">8</td>
              </tr>
              <tr>
                <td className="py-3 px-4">2XL</td>
                <td className="py-3 px-4">1536px+</td>
                <td className="py-3 px-4">6</td>
                <td className="py-3 px-4">8</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}