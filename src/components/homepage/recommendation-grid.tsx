'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProductWithCategory, PaginatedResponse } from '@/types'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import ProductCard from '@/components/products/product-card'
import ScrollSentinel from '@/components/ui/scroll-sentinel'
import { ProductGridSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface RecommendationItem {
  productId: string;
  score: number;
  reason: string;
  product: ProductWithCategory;
}

interface RecommendationGridProps {
  apiEndpoint: string
  onProductClick?: (product: ProductWithCategory) => void
  compact?: boolean
  className?: string
  pageSize?: number
}

// Create a stable empty initial data object
const EMPTY_INITIAL_DATA: PaginatedResponse<ProductWithCategory> = {
  data: [],
  pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
}

export default function RecommendationGrid({
  apiEndpoint,
  onProductClick,
  compact = false,
  className = '',
  pageSize = 12
}: RecommendationGridProps) {
  const [initialData, setInitialData] = useState<PaginatedResponse<ProductWithCategory>>(EMPTY_INITIAL_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const url = new URL(apiEndpoint, window.location.origin)
        url.searchParams.set('page', '1')
        url.searchParams.set('limit', pageSize.toString())

        const response = await fetch(url.toString())
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Transform recommendation response to match PaginatedResponse format
        let products: ProductWithCategory[] = []
        if (data.products && Array.isArray(data.products)) {
          products = data.products.map((item: RecommendationItem) => item.product)
        }
        
        const transformedData: PaginatedResponse<ProductWithCategory> = {
          data: products,
          pagination: {
            page: 1,
            limit: pageSize,
            total: data.total || products.length,
            totalPages: data.pagination?.totalPages || Math.ceil((data.total || products.length) / pageSize)
          }
        }
        
        setInitialData(transformedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [apiEndpoint, pageSize])

  // Use infinite scroll hook with initial data
  const infiniteScrollResult = useInfiniteScroll({
    initialData,
    fetchUrl: apiEndpoint,
    pageSize,
    enabled: !loading && !error && initialData.data.length > 0
  })

  // Handle loading more products
  const handleLoadMore = useCallback(() => {
    // This will be handled by the infinite scroll hook
  }, [])

  if (loading) {
    return <ProductGridSkeleton count={pageSize} />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load recommendations</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="inline-flex items-center gap-2"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Try again
        </Button>
      </div>
    )
  }

  if (infiniteScrollResult.products.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
        <p className="text-gray-500">Check back later for personalized recommendations.</p>
      </div>
    )
  }

  const { products, loadingMore, hasMore, retry } = infiniteScrollResult

  return (
    <div className={className}>
      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductClick={onProductClick}
            compact={compact}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="mt-6">
          <ProductGridSkeleton count={6} />
        </div>
      )}

      {/* Scroll Sentinel for Infinite Loading */}
      {hasMore && !loadingMore && (
        <ScrollSentinel 
          onIntersect={handleLoadMore}
          loading={loadingMore}
          hasMore={hasMore}
          className="mt-6" 
        />
      )}

      {/* End of Results */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-6 mt-4">
          <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-full border">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">
              All {products.length} recommendations shown
            </span>
          </div>
        </div>
      )}

      {/* Error State for Additional Pages */}
      {infiniteScrollResult.error && (
        <div className="text-center py-4 mt-4">
          <p className="text-red-600 text-sm mb-2">Failed to load more recommendations</p>
          <Button
            onClick={retry}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}