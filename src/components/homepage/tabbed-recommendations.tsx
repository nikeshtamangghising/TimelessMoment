'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ProductWithCategory } from '@/types'
import ProductCard from '@/components/products/product-card'
import ProductModal from '@/components/products/product-modal'

interface RecommendationItem {
  productId: string;
  score: number;
  reason: string;
  product: ProductWithCategory;
}

interface TabData {
  products: RecommendationItem[];
  loading: boolean;
  loaded: boolean;
}

type TabType = 'trending' | 'personalized' | 'popular'

interface Tab {
  id: TabType
  label: string
  icon: string
  endpoint: string
}

export default function TabbedRecommendations() {
  const { data: session } = useSession()
  const [tabsData, setTabsData] = useState<Record<TabType, TabData>>({
    trending: { products: [], loading: false, loaded: false },
    personalized: { products: [], loading: false, loaded: false },
    popular: { products: [], loading: false, loaded: false }
  })
  const [activeTab, setActiveTab] = useState<TabType>('trending')
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fixed number of products to show (good amount for homepage)
  const PRODUCTS_LIMIT = 24

  // Define available tabs
  const getTabs = (): Tab[] => {
    const baseTabs: Tab[] = [
      {
        id: 'trending',
        label: 'Trending Now',
        icon: '🔥',
        endpoint: 'trending'
      },
      {
        id: 'popular',
        label: 'Popular Choices',
        icon: '⭐',
        endpoint: 'popular'
      }
    ]

    // Add personalized tab for logged-in users
    if (session?.user) {
      baseTabs.splice(1, 0, {
        id: 'personalized',
        label: 'For You',
        icon: '✨',
        endpoint: 'personalized'
      })
    }

    return baseTabs
  }

  const tabs = getTabs()

  // Set default active tab
  useEffect(() => {
    if (session?.user) {
      setActiveTab('personalized')
    } else {
      setActiveTab('trending')
    }
  }, [session])

  // Fetch data for a specific tab (one-time load)
  const fetchTabData = useCallback(async (tabType: TabType) => {
    const currentData = tabsData[tabType]
    if (currentData.loaded || currentData.loading) return // Already loaded or loading
    
    setTabsData(prev => ({
      ...prev,
      [tabType]: { ...prev[tabType], loading: true }
    }))

    try {
      const userId = session?.user?.id || 'guest'
      const tab = tabs.find(t => t.id === tabType)
      if (!tab) return

      const response = await fetch(
        `/api/recommendations/${userId}/${tab.endpoint}?limit=${PRODUCTS_LIMIT}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${tabType} recommendations`)
      }
      
      const data = await response.json()
      const products = data.products || []
      
      setTabsData(prev => ({
        ...prev,
        [tabType]: {
          products: products,
          loading: false,
          loaded: true
        }
      }))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${tabType} data`)
      setTabsData(prev => ({
        ...prev,
        [tabType]: { ...prev[tabType], loading: false }
      }))
    } finally {
      setInitialLoading(false)
    }
  }, [session, tabs, tabsData, PRODUCTS_LIMIT])

  // Load initial data for active tab
  useEffect(() => {
    fetchTabData(activeTab)
  }, [activeTab, fetchTabData])

  // Handle tab change
  const handleTabChange = (tabType: TabType) => {
    setActiveTab(tabType)
    fetchTabData(tabType) // Load data if not already loaded
  }

  const handleProductClick = (product: ProductWithCategory) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }



  if (initialLoading) {
    return (
      <section className="py-3 bg-white">
        <div className="max-w-full mx-auto px-2 sm:px-3 lg:px-4">
          {/* Tab skeleton */}
          <div className="flex justify-center mb-3">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full max-w-md">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 animate-pulse">
                  <div className="h-8 bg-gray-300 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Products skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg aspect-square mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-0.5"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load recommendations: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (tabs.length === 0) {
    return null
  }

  const currentTabData = tabsData[activeTab]
  const currentProducts = currentTabData.products

  return (
    <section className="py-3 bg-white">
      <div className="max-w-full mx-auto px-2 sm:px-3 lg:px-4">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full max-w-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-2 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-xs sm:text-sm">{tab.icon}</span>
                <span className="hidden xs:inline text-xs sm:text-sm">{tab.label}</span>
                <span className="xs:hidden text-xs">
                  {tab.id === 'trending' ? 'Hot' : 
                   tab.id === 'personalized' ? 'You' : 
                   'Top'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {currentProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
              {currentProducts.map((item) => (
                <ProductCard
                  key={item.product.id}
                  product={item.product}
                  onProductClick={handleProductClick}
                  compact={true}
                />
              ))}
            </div>
            
            {/* End of products message */}
            <div className="text-center py-6 mt-4">
              <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-full border">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">
                  {currentProducts.length === PRODUCTS_LIMIT 
                    ? `Showing ${PRODUCTS_LIMIT} products` 
                    : `All ${currentProducts.length} products shown`}
                </span>
              </div>
            </div>
          </>
        ) : currentTabData.loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg aspect-square mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-0.5"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No products available in this category.</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  )
}