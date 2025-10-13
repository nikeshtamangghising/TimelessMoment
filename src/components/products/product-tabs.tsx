'use client'

import { useState } from 'react'
import { Product } from '@/types'
import ProductSpecifications from './product-specifications'
import ProductReviews from './product-reviews'

interface ProductTabsProps {
  product: Product
  className?: string
}

type TabType = 'specifications' | 'reviews'

export default function ProductTabs({ product, className = '' }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('specifications')

  const tabs = [
    {
      id: 'specifications' as TabType,
      name: 'Specifications',
      count: null
    },
    {
      id: 'reviews' as TabType,
      name: 'Reviews & Comments',
      count: product.ratingCount || 0
    }
  ]

  return (
    <div className={`${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'specifications' && (
          <ProductSpecifications product={product} />
        )}
        {activeTab === 'reviews' && (
          <ProductReviews product={product} />
        )}
      </div>
    </div>
  )
}
