import { useState, useEffect, useRef, useCallback } from 'react'
import { ProductWithCategory, PaginatedResponse } from '@/types'

export interface UseInfiniteScrollOptions {
  initialData: PaginatedResponse<ProductWithCategory>
  fetchUrl: string
  pageSize: number
  enabled?: boolean
  searchParams?: Record<string, string | undefined>
}

export interface UseInfiniteScrollReturn {
  products: ProductWithCategory[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  retry: () => void
  reset: () => void
  totalCount: number
  loadedCount: number
}

export function useInfiniteScroll({
  initialData,
  fetchUrl,
  pageSize,
  enabled = true,
  searchParams = {}
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [products, setProducts] = useState<ProductWithCategory[]>(initialData.data)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(initialData.pagination.page)
  const [totalPages, setTotalPages] = useState(initialData.pagination.totalPages)
  const [totalCount, setTotalCount] = useState(initialData.pagination.total)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const fetchingRef = useRef(false)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const requestCacheRef = useRef<Map<string, PaginatedResponse<ProductWithCategory>>>(new Map())
  const lastRequestKeyRef = useRef<string>('')
  const initialDataRef = useRef(initialData)

  // Calculate hasMore based on current page and total pages
  const hasMore = currentPage < totalPages

  // Calculate loaded count
  const loadedCount = products.length

  const buildFetchUrl = useCallback((page: number) => {
    const params = new URLSearchParams()
    
    // Add search parameters
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })
    
    // Add pagination parameters
    params.set('page', String(page))
    params.set('limit', String(pageSize))
    
    return `${fetchUrl}?${params.toString()}`
  }, [fetchUrl, pageSize, searchParams])

  const buildCacheKey = useCallback((page: number) => {
    const params = new URLSearchParams()
    
    // Add search parameters for cache key (excluding timestamp)
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })
    
    params.set('page', String(page))
    params.set('limit', String(pageSize))
    
    return `${fetchUrl}?${params.toString()}`
  }, [fetchUrl, pageSize, searchParams])

  const fetchNextPage = useCallback(async () => {
    if (!enabled || fetchingRef.current || !hasMore || loadingMore) {
      return
    }

    fetchingRef.current = true
    setLoadingMore(true)
    setError(null)

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    // Set up timeout (10 seconds)
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    try {
      const nextPage = currentPage + 1
      const cacheKey = buildCacheKey(nextPage)
      
      // Check cache first
      if (requestCacheRef.current.has(cacheKey)) {
        const cachedData = requestCacheRef.current.get(cacheKey)!
        setProducts(prev => [...prev, ...cachedData.data])
        setCurrentPage(cachedData.pagination.page)
        setTotalPages(cachedData.pagination.totalPages)
        setTotalCount(cachedData.pagination.total)
        retryCountRef.current = 0
        return
      }
      
      const url = buildFetchUrl(nextPage)
      
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'default', // Use default caching for better performance
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
      }

      const data: PaginatedResponse<ProductWithCategory> = await response.json()
      
      if (data.data && Array.isArray(data.data)) {
        // Cache the response
        requestCacheRef.current.set(cacheKey, data)
        
        setProducts(prev => [...prev, ...data.data])
        setCurrentPage(data.pagination.page)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
        retryCountRef.current = 0 // Reset retry count on success
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      
      if (err.name === 'AbortError') {
        // Check if it was a timeout or manual abort
        if (fetchingRef.current) {
          setError('Request timed out. Please check your connection and try again.')
        }
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more products'
      setError(errorMessage)
      console.error('Error fetching next page:', err)
    } finally {
      setLoadingMore(false)
      fetchingRef.current = false
    }
  }, [enabled, hasMore, loadingMore, currentPage, buildFetchUrl])

  const retry = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      setError('Maximum retry attempts reached. Please refresh the page.')
      return
    }

    retryCountRef.current += 1
    setError(null)
    
    if (products.length === 0) {
      // If no products loaded, this is initial load retry
      setLoading(true)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        const url = buildFetchUrl(1)
        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`)
        }

        const data: PaginatedResponse<ProductWithCategory> = await response.json()
        setProducts(data.data)
        setCurrentPage(data.pagination.page)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
        retryCountRef.current = 0
      } catch (err: any) {
        clearTimeout(timeoutId)
        
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.')
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load products')
        }
      } finally {
        setLoading(false)
      }
    } else {
      // Retry loading next page
      await fetchNextPage()
    }
  }, [products.length, buildFetchUrl, fetchNextPage])

  // Update the ref when initialData changes
  useEffect(() => {
    initialDataRef.current = initialData
  }, [initialData])

  const reset = useCallback(() => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Reset all state to initial values using the ref
    const currentInitialData = initialDataRef.current
    setProducts(currentInitialData.data)
    setCurrentPage(currentInitialData.pagination.page)
    setTotalPages(currentInitialData.pagination.totalPages)
    setTotalCount(currentInitialData.pagination.total)
    setLoading(false)
    setLoadingMore(false)
    setError(null)
    fetchingRef.current = false
    retryCountRef.current = 0
  }, []) // No dependencies - stable function

  // Reset when search parameters change
  useEffect(() => {
    // Clear cache when search parameters change
    requestCacheRef.current.clear()
    reset()
  }, [searchParams, reset])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Clear cache on unmount to prevent memory leaks
      requestCacheRef.current.clear()
    }
  }, [])

  return {
    products,
    loading,
    loadingMore,
    hasMore,
    error,
    retry,
    reset,
    totalCount,
    loadedCount,
    fetchNextPage // Expose for manual triggering
  } as UseInfiniteScrollReturn & { fetchNextPage: () => Promise<void> }
}