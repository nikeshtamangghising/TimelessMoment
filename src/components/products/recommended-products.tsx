'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Product } from '@/types'
import ProductCard from './product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'

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
  const [error, setError] = useState<string | null>(null)
  const [limit] = useState(8)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const userId = session?.user?.id || 'guest'

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingRef = useRef(false)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  const fetchPage = useCallback(async (nextOffset: number, append: boolean) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const params = new URLSearchParams({ userId, limit: String(limit), offset: String(nextOffset) })
      const response = await fetch(`/api/products/${productId}/mixed-recommendations?${params.toString()}` , { signal: controller.signal })
      if (!response.ok) {
        throw new Error('Failed to load recommendations')
      }
      const data: RecommendationData = await response.json()
      if (data.success) {
        // Deduplicate on client side as a safety net
        const deduped = data.data.filter(item => !seenIdsRef.current.has(item.productId))
        deduped.forEach(item => seenIdsRef.current.add(item.productId))
        setItems(prev => append ? [...prev, ...deduped] : deduped)
        setHasMore(deduped.length >= limit)
        setOffset(nextOffset)
      } else {
        setError('Failed to load recommendations')
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        // ignore aborts
      } else {
        setError('Failed to load recommendations')
      }
    } finally {
      setLoading(false)
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

  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !fetchingRef.current) {
          const nextOffset = offset + limit
          fetchPage(nextOffset, true)
        }
      })
    }, { rootMargin: '200px 0px' })

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [offset, limit, hasMore, fetchPage])

  if ((loading && items.length === 0)) {
    return (
      <div className={`${className}`}>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (error || items.length === 0) {
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
      
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
        {items.map(({ product, reason }) => (
          <div key={product.id} className="relative">
            <ProductCard
              product={product as any}
              trackViews={false}
              compact={true}
              onProductClick={() => {
                // Navigate to product page
                window.location.href = `/products/${product.slug}`
              }}
            />
            {/* Recommendation reason badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm border border-white/20 ${
                reason === 'similar' ? 'bg-blue-500/90 text-white' :
                reason === 'trending' ? 'bg-orange-500/90 text-white' :
                reason === 'popular' ? 'bg-green-500/90 text-white' :
                'bg-purple-500/90 text-white'
              }`}>
                {reason === 'similar' ? '🔗 Similar' :
                 reason === 'trending' ? '📈 Trending' :
                 reason === 'popular' ? '🔥 Popular' :
                 '✨ For You'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8" />
      {loading && items.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-3 text-gray-500 bg-gray-50 px-6 py-3 rounded-full">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading more recommendations...
          </div>
        </div>
      )}
    </div>
  )
}
