'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Product } from '@/types'
import ProductCard from './product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import ScrollSentinel from '@/components/ui/scroll-sentinel'
import { Button } from '@/components/ui/button'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface RecommendedProductsProps {
  productId: string
  className?: string
}

interface MixedRecommendationItem {
  productId: string
  score: number
  reason: 'similar'|'popular'|'trending'|'personalized'
  product: Product
}

interface RecommendationData {
  success: boolean
  data: MixedRecommendationItem[]
  count: number
}

export default function RecommendedProducts({ productId, className = '' }: RecommendedProductsProps) {
  const { data: session } = useSession()
  const [items, setItems] = useState<MixedRecommendationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limit] = useState(4) // Reduced initial limit for faster load
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const userId = session?.user?.id || 'guest'

  const fetchingRef = useRef(false)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const fetchPage = useCallback(async (nextOffset: number, append: boolean) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    // Set up timeout (10 seconds)
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 20000)

    try {
      const params = new URLSearchParams({ userId, limit: String(limit), offset: String(nextOffset) })
      const response = await fetch(`/api/products/${productId}/mixed-recommendations?${params.toString()}`, { 
        signal: controller.signal,
        cache: 'force-cache', // Use aggressive caching for instant feel
        priority: 'low', // Lower priority since it's below the fold
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to load recommendations: ${response.status} ${response.statusText}`)
      }
      
      const data: RecommendationData = await response.json()
      if (data.success) {
        // Deduplicate on client side as a safety net
        const deduped = data.data.filter(item => !seenIdsRef.current.has(item.productId))
        deduped.forEach(item => seenIdsRef.current.add(item.productId))

        // Fallback: if nothing came back on first page, load popular
        if (deduped.length === 0 && nextOffset === 0) {
          try {
            const popularRes = await fetch(`/api/recommendations/guest/popular?page=1&limit=${limit}`, { cache: 'force-cache', priority: 'low' as any })
            if (popularRes.ok) {
              const popularData = await popularRes.json()
              if (Array.isArray(popularData.products)) {
                const popularItems = popularData.products.map((p: any) => ({
                  productId: p.product.id,
                  score: p.score || 0,
                  reason: 'popular',
                  product: p.product,
                }))
                setItems(popularItems)
                setHasMore(false)
                setOffset(0)
                retryCountRef.current = 0
                return
              }
            }
          } catch {}
        }

        setItems(prev => append ? [...prev, ...deduped] : deduped)
        setHasMore(deduped.length >= limit)
        setOffset(nextOffset)
        retryCountRef.current = 0 // Reset retry count on success
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      
      if (err.name === 'AbortError') {
        // Graceful fallback on timeout: try popular once
        try {
          const popularRes = await fetch(`/api/recommendations/guest/popular?page=1&limit=${limit}`, { cache: 'force-cache', priority: 'low' as any })
          if (popularRes.ok) {
            const popularData = await popularRes.json()
            if (Array.isArray(popularData.products)) {
              const popularItems = popularData.products.map((p: any) => ({
                productId: p.product.id,
                score: p.score || 0,
                reason: 'popular',
                product: p.product,
              }))
              setItems(popularItems)
              setHasMore(false)
              setOffset(0)
              retryCountRef.current = 0
              return
            }
          }
        } catch {}
        setHasMore(false)
        return
      }
      
      // On error, attempt popular fallback as well
      try {
        const popularRes = await fetch(`/api/recommendations/guest/popular?page=1&limit=${limit}`, { cache: 'force-cache', priority: 'low' as any })
        if (popularRes.ok) {
          const popularData = await popularRes.json()
          if (Array.isArray(popularData.products)) {
            const popularItems = popularData.products.map((p: any) => ({
              productId: p.product.id,
              score: p.score || 0,
              reason: 'popular',
              product: p.product,
            }))
            setItems(popularItems)
            setHasMore(false)
            setOffset(0)
            retryCountRef.current = 0
            return
          }
        }
      } catch {}

      const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations'
      setError(errorMessage)
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      fetchingRef.current = false
    }
  }, [productId, userId, limit])

  useEffect(() => {
    // Reset when product or user changes
    setItems([])
    setOffset(0)
    setHasMore(true)
    setError(null)
    seenIdsRef.current = new Set()
    fetchPage(0, false)
  }, [productId, userId, fetchPage])

  const handleScrollIntersect = useCallback(() => {
    if (!loadingMore && hasMore && !error && !fetchingRef.current) {
      const nextOffset = offset + limit
      fetchPage(nextOffset, true)
    }
  }, [offset, limit, hasMore, loadingMore, error, fetchPage])

  const retry = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      setError('Maximum retry attempts reached. Please refresh the page.')
      return
    }

    retryCountRef.current += 1
    
    if (items.length === 0) {
      // Retry initial load
      setItems([])
      setOffset(0)
      setHasMore(true)
      seenIdsRef.current = new Set()
      await fetchPage(0, false)
    } else {
      // Retry loading more
      await fetchPage(offset + limit, true)
    }
  }, [items.length, offset, limit, fetchPage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  // Show initial loading skeleton
  if (loading && items.length === 0) {
    return (
      <div className={`${className}`}>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  // Hide error UI when no items loaded (graceful fallback)
  if (error && items.length === 0) {
    return null
  }

  // Don't render if no items and no error (empty state)
  if (items.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-900">You May Also Like</h2>
        <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border">
          Mixed: Similar • Trending • Popular{session?.user ? ' • Personalized' : ''}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
        {items.map(({ product, reason }) => (
          <div key={product.id} className="relative">
            <ProductCard
              product={product as any}
              trackViews={false}
              compact={true}

            />
            {/* Recommendation reason badge */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20">
              <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm border border-white/20 ${
                reason === 'similar' ? 'bg-blue-500/90 text-white' :
                reason === 'trending' ? 'bg-orange-500/90 text-white' :
                reason === 'popular' ? 'bg-green-500/90 text-white' :
                'bg-purple-500/90 text-white'
              }`}>
                <span className="hidden sm:inline">
                  {reason === 'similar' ? '🔗 Similar' :
                   reason === 'trending' ? '📈 Trending' :
                   reason === 'popular' ? '🔥 Popular' :
                   '✨ For You'}
                </span>
                <span className="sm:hidden">
                  {reason === 'similar' ? '🔗' :
                   reason === 'trending' ? '📈' :
                   reason === 'popular' ? '🔥' :
                   '✨'}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Loading More State */}
      {loadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-6 py-3 rounded-full border">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Loading more recommendations...</span>
          </div>
        </div>
      )}

      {/* Error State for Loading More */}
      {error && items.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-4 text-sm">{error}</p>
            <Button 
              onClick={retry} 
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* End of Results Message */}
      {!hasMore && items.length > 0 && !loadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-gray-500 text-sm">
              That's all the recommendations we have for you!
            </p>
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
      />
    </div>
  )
}
