import { unstable_cache } from 'next/cache'
import { revalidateTag, revalidatePath } from 'next/cache'

// Cache configuration
export const CACHE_TAGS = {
  PRODUCTS: 'products',
  PRODUCT: 'product',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER: 'order',
  USER: 'user',
  STATS: 'stats',
} as const

export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const

// In-memory cache for frequently accessed data
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()
  private maxSize = 1000 // Maximum number of items to cache

  set(key: string, data: any, ttl: number = CACHE_DURATIONS.MEDIUM): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    const expires = Date.now() + ttl * 1000
    this.cache.set(key, { data, expires })
  }

  get<T = any>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  size(): number {
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.1)) // Remove 10%
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }
}

export const memoryCache = new MemoryCache()

// Cache key generators
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

export function generateProductCacheKey(id: string | number): string {
  return generateCacheKey(CACHE_TAGS.PRODUCT, id)
}

export function generateProductsCacheKey(filters: Record<string, any> = {}): string {
  const filterString = Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return generateCacheKey(CACHE_TAGS.PRODUCTS, filterString)
}

export function generateUserCacheKey(id: string): string {
  return generateCacheKey(CACHE_TAGS.USER, id)
}

export function generateOrderCacheKey(id: string): string {
  return generateCacheKey(CACHE_TAGS.ORDER, id)
}

// Next.js cache wrappers
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    tags?: string[]
    revalidate?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const { tags = [], revalidate = CACHE_DURATIONS.MEDIUM, keyGenerator } = options

  return unstable_cache(
    fn,
    keyGenerator ? undefined : [fn.name],
    {
      tags,
      revalidate,
    }
  ) as T
}

// Cache invalidation utilities
export async function invalidateCache(tags: string | string[]): Promise<void> {
  const tagsArray = Array.isArray(tags) ? tags : [tags]
  
  for (const tag of tagsArray) {
    revalidateTag(tag)
  }
}

export async function invalidatePath(path: string): Promise<void> {
  revalidatePath(path)
}

export async function invalidateProduct(productId: string | number): Promise<void> {
  await invalidateCache([
    CACHE_TAGS.PRODUCT,
    CACHE_TAGS.PRODUCTS,
    CACHE_TAGS.CATEGORIES,
  ])
  
  // Also invalidate memory cache
  memoryCache.delete(generateProductCacheKey(productId))
}

export async function invalidateProducts(): Promise<void> {
  await invalidateCache([
    CACHE_TAGS.PRODUCTS,
    CACHE_TAGS.CATEGORIES,
  ])
}

export async function invalidateOrder(orderId: string): Promise<void> {
  await invalidateCache([
    CACHE_TAGS.ORDER,
    CACHE_TAGS.ORDERS,
    CACHE_TAGS.STATS,
  ])
  
  memoryCache.delete(generateOrderCacheKey(orderId))
}

export async function invalidateUser(userId: string): Promise<void> {
  await invalidateCache([CACHE_TAGS.USER])
  memoryCache.delete(generateUserCacheKey(userId))
}

export function clearMemoryCache(): void {
  memoryCache.clear()
}

// Hybrid caching strategy (memory + Next.js cache)
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    memoryTtl?: number
    nextjsTags?: string[]
    nextjsRevalidate?: number
  } = {}
): Promise<T> {
  const {
    memoryTtl = CACHE_DURATIONS.SHORT,
    nextjsTags = [],
    nextjsRevalidate = CACHE_DURATIONS.MEDIUM,
  } = options

  // Try memory cache first
  const memoryData = memoryCache.get<T>(key)
  if (memoryData !== null) {
    return memoryData
  }

  // Create cached fetcher with Next.js cache
  const cachedFetcher = createCachedFunction(
    fetcher,
    {
      tags: nextjsTags,
      revalidate: nextjsRevalidate,
    }
  )

  // Fetch data
  const data = await cachedFetcher()

  // Store in memory cache
  memoryCache.set(key, data, memoryTtl)

  return data
}

// Cache warming utilities
export async function warmCache(operations: Array<() => Promise<any>>): Promise<void> {
  try {
    await Promise.allSettled(operations)
  } catch (error) {
    console.error('Cache warming error:', error)
  }
}

// Cache statistics
export function getCacheStats(): {
  memory: ReturnType<MemoryCache['getStats']>
  timestamp: string
} {
  return {
    memory: memoryCache.getStats(),
    timestamp: new Date().toISOString(),
  }
}

// Cache middleware for API routes
export function withCache<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options: {
    ttl?: number
    tags?: string[]
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const { ttl = CACHE_DURATIONS.MEDIUM, tags = [], keyGenerator } = options

  return (async (...args: Parameters<T>) => {
    const cacheKey = keyGenerator ? keyGenerator(...args) : `api:${handler.name}`
    
    // Try to get from memory cache
    const cached = memoryCache.get(cacheKey)
    if (cached) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (process.env.NODE_ENV === 'production') {
        headers['X-Cache'] = 'HIT'
      }
      
      return new Response(JSON.stringify(cached.data), { headers })
    }

    // Execute handler
    const response = await handler(...args)
    
    // Cache successful responses
    if (response.ok) {
      try {
        const data = await response.clone().json()
        memoryCache.set(cacheKey, { data }, ttl)
      } catch (error) {
        // Ignore JSON parsing errors for non-JSON responses
      }
    }

    // Add cache headers only in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('X-Cache', 'MISS')
      response.headers.set('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}`)
    }

    return response
  }) as T
}

// Preload cache for critical data
export async function preloadCriticalData(): Promise<void> {
  const operations = [
    // Preload featured products
    () => getCachedData(
      'featured-products',
      async () => {
        const { productRepository } = await import('./product-repository')
        return productRepository.findMany(
          { isActive: true },
          { page: 1, limit: 10 }
        )
      },
      {
        memoryTtl: CACHE_DURATIONS.MEDIUM,
        nextjsTags: [CACHE_TAGS.PRODUCTS],
        nextjsRevalidate: CACHE_DURATIONS.LONG,
      }
    ),

    // Preload categories
    () => getCachedData(
      'categories',
      async () => {
        const { productRepository } = await import('./product-repository')
        return productRepository.getCategories()
      },
      {
        memoryTtl: CACHE_DURATIONS.LONG,
        nextjsTags: [CACHE_TAGS.CATEGORIES],
        nextjsRevalidate: CACHE_DURATIONS.VERY_LONG,
      }
    ),
  ]

  await warmCache(operations)
}