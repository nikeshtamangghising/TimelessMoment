'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Product } from '@/types'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'

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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
        <div className="text-sm text-gray-500">Mixed: Similar • Trending • Popular{session?.user ? ' • Personalized' : ''}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(({ product, reason }) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg">
              <Image
                src={product.images[0] || '/placeholder-product.jpg'}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 line-clamp-2">
                  {product.name}
                </h3>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">{reason}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xl font-bold text-indigo-600">
                  {formatCurrency(product.discountPrice || product.price, (product as any).currency || DEFAULT_CURRENCY)}
                </span>
                {product.ratingAvg && product.ratingCount > 0 && (
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.ratingAvg || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1 text-sm text-gray-600">
                      ({product.ratingCount})
                    </span>
                  </div>
                )}
              </div>
              {product.inventory <= (product.lowStockThreshold || 5) && product.inventory > 0 && (
                <div className="mt-2 text-sm text-yellow-600">
                  Only {product.inventory} left in stock
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8" />
      {loading && (
        <div className="flex justify-center mt-4 text-sm text-gray-500">Loading more…</div>
      )}
    </div>
  )
}
