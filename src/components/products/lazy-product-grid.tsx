'use client'

import { useCallback, useState, useEffect } from 'react'
import { ProductWithCategory, PaginatedResponse } from '@/types'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import ProductCard from './product-card'
import ScrollSentinel from '@/components/ui/scroll-sentinel'
import { ProductGridSkeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface LazyProductGridProps {
  initialData: PaginatedResponse<ProductWithCategory>
  searchParams: Record<string, string | undefined>
  apiEndpoint: string
  className?: string
  gridColumns?: number
  viewMode?: 'grid' | 'list'

  showFavoriteButton?: boolean
  trackViews?: boolean
  compact?: boolean
  pageSize?: number
}

export default function LazyProductGrid({
  initialData,
  searchParams,
  apiEndpoint,
  className = '',
  gridColumns = 4,
  viewMode = 'grid',

  showFavoriteButton = true,
  trackViews = true,
  compact = false,
  pageSize = 12
}: LazyProductGridProps) {
  const {
    products,
    loading,
    loadingMore,
    hasMore,
    error,
    retry,
    totalCount,
    loadedCount,
    ...infiniteScrollResult
  } = useInfiniteScroll({
    initialData,
    fetchUrl: apiEndpoint,
    pageSize,
    searchParams
  })

  // Accessibility: Announce loading states to screen readers
  const [announcement, setAnnouncement] = useState('')
  
  useEffect(() => {
    if (loadingMore) {
      setAnnouncement('Loading more products...')
    } else if (error) {
      setAnnouncement(`Error loading products: ${error}`)
    } else if (!hasMore && products.length > 0) {
      setAnnouncement(`All ${totalCount} products loaded`)
    } else if (products.length > 0) {
      setAnnouncement(`${loadedCount} of ${totalCount} products loaded`)
    }
  }, [loadingMore, error, hasMore, products.length, totalCount, loadedCount])



  const handleScrollIntersect = useCallback(() => {
    if (!loadingMore && hasMore && !error && 'fetchNextPage' in infiniteScrollResult) {
      (infiniteScrollResult as any).fetchNextPage()
    }
  }, [infiniteScrollResult, loadingMore, hasMore, error])

  // Grid column classes based on gridColumns prop
  const getGridClasses = () => {
    if (viewMode === 'list') {
      return 'space-y-4'
    }
    
    switch (gridColumns) {
      case 3:
        return 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6'
      case 4:
        return 'grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4'
      case 5:
        return 'grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-2 sm:gap-3'
      default:
        return 'grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4'
    }
  }

  // Show minimal initial loading skeleton for premium feel
  if (loading && products.length === 0) {
    return (
      <div className={className}>
        <ProductGridSkeleton count={Math.min(pageSize, 4)} />
      </div>
    )
  }

  // Show error state if no products loaded
  if (error && products.length === 0) {
    return (
      <div className={`${className} flex flex-col items-center justify-center py-12 sm:py-16 px-4`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8 max-w-sm sm:max-w-md text-center w-full">
          <ExclamationTriangleIcon className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-red-800 mb-2">
            <span className="hidden xs:inline">Unable to load products</span>
            <span className="xs:hidden">Load failed</span>
          </h3>
          <p className="text-red-600 mb-4 sm:mb-6 text-sm">{error}</p>
          <Button 
            onClick={retry} 
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 text-sm px-4 py-2 touch-manipulation"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Try Again</span>
            <span className="xs:hidden">Retry</span>
          </Button>
        </div>
      </div>
    )
  }

  // Show no products message
  if (products.length === 0 && !loading) {
    return (
      <div className={`${className} flex flex-col items-center justify-center py-12 sm:py-16 px-4`}>
        <div className="text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
            <span className="hidden xs:inline">No products found</span>
            <span className="xs:hidden">No products</span>
          </h3>
          <p className="text-gray-500 text-sm">
            <span className="hidden sm:inline">Try adjusting your search or filter criteria</span>
            <span className="sm:hidden">Try different filters</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      {/* Products Grid */}
      <div 
        className={getGridClasses()}
        role="grid"
        aria-label={`Product grid showing ${loadedCount} of ${totalCount} products`}
        aria-busy={loadingMore}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            role="gridcell"
            aria-rowindex={Math.floor(index / gridColumns) + 1}
            aria-colindex={(index % gridColumns) + 1}
          >
            <ProductCard
              product={product}

              showFavoriteButton={showFavoriteButton}
              trackViews={trackViews}
              compact={compact}
            />
          </div>
        ))}
      </div>

      {/* Loading More State - Responsive */}
      {loadingMore && (
        <div 
          className="flex justify-center items-center py-6 sm:py-8"
          role="status"
          aria-label="Loading more products"
        >
          <div className="flex items-center gap-2 sm:gap-3 text-gray-600 bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 rounded-full border">
            <div 
              className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600"
              aria-hidden="true"
            ></div>
            <span className="text-xs sm:text-sm font-medium">
              <span className="hidden xs:inline">Loading more products...</span>
              <span className="xs:hidden">Loading...</span>
            </span>
          </div>
        </div>
      )}

      {/* Error State for Loading More - Responsive */}
      {error && products.length > 0 && (
        <div 
          className="flex justify-center items-center py-6 sm:py-8 px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md text-center w-full">
            <ExclamationTriangleIcon 
              className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mx-auto mb-2 sm:mb-3" 
              aria-hidden="true"
            />
            <p className="text-red-600 mb-3 sm:mb-4 text-xs sm:text-sm">{error}</p>
            <Button 
              onClick={retry} 
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 text-xs sm:text-sm px-3 sm:px-4 py-2 touch-manipulation"
              aria-label="Retry loading more products"
            >
              <ArrowPathIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden xs:inline">Try Again</span>
              <span className="xs:hidden">Retry</span>
            </Button>
          </div>
        </div>
      )}

      {/* End of Results Message - Responsive */}
      {!hasMore && products.length > 0 && !loadingMore && (
        <div 
          className="flex flex-col items-center justify-center py-8 sm:py-12 px-4"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="text-2xl sm:text-4xl mb-2 sm:mb-3" aria-hidden="true">✅</div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              <span className="hidden xs:inline">No more products to load</span>
              <span className="xs:hidden">All products loaded</span>
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm">
              <span className="hidden sm:inline">
                You've seen all {totalCount} products
                {loadedCount !== totalCount && ` (${loadedCount} loaded)`}
              </span>
              <span className="sm:hidden">
                {totalCount} products total
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Progress Indicator - Responsive */}
      {hasMore && products.length > 0 && (
        <div 
          className="flex justify-center items-center py-3 sm:py-4"
          role="status"
          aria-label={`${loadedCount} of ${totalCount} products loaded`}
        >
          <div className="text-xs text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
            <span className="hidden xs:inline">
              {loadedCount} of {totalCount} products loaded
            </span>
            <span className="xs:hidden">
              {loadedCount}/{totalCount}
            </span>
          </div>
        </div>
      )}

      {/* Scroll Sentinel */}
      <ScrollSentinel
        onIntersect={handleScrollIntersect}
        loading={loadingMore}
        hasMore={hasMore}
        threshold="200px"
        disabled={!!error}
        className="focus:outline-none"
      />
    </div>
  )
}