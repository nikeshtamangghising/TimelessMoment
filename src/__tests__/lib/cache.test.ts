import {
  memoryCache,
  generateCacheKey,
  generateProductCacheKey,
  generateProductsCacheKey,
  getCachedData,
  invalidateCache,
  invalidateProduct,
  getCacheStats,
  CACHE_TAGS,
  CACHE_DURATIONS,
} from '@/lib/cache'

// Mock Next.js cache functions
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))

describe('Cache System', () => {
  beforeEach(() => {
    memoryCache.clear()
    jest.clearAllMocks()
  })

  describe('MemoryCache', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'Test Product' }
      
      memoryCache.set('test-key', testData, CACHE_DURATIONS.SHORT)
      const retrieved = memoryCache.get('test-key')
      
      expect(retrieved).toEqual(testData)
    })

    it('should return null for non-existent keys', () => {
      const result = memoryCache.get('non-existent-key')
      expect(result).toBeNull()
    })

    it('should expire data after TTL', async () => {
      const testData = { id: 1, name: 'Test Product' }
      
      memoryCache.set('test-key', testData, 0.1) // 100ms TTL
      
      // Should be available immediately
      expect(memoryCache.get('test-key')).toEqual(testData)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should be expired
      expect(memoryCache.get('test-key')).toBeNull()
    })

    it('should check if key exists', () => {
      memoryCache.set('test-key', 'test-value')
      
      expect(memoryCache.has('test-key')).toBe(true)
      expect(memoryCache.has('non-existent-key')).toBe(false)
    })

    it('should delete keys', () => {
      memoryCache.set('test-key', 'test-value')
      
      expect(memoryCache.has('test-key')).toBe(true)
      
      const deleted = memoryCache.delete('test-key')
      
      expect(deleted).toBe(true)
      expect(memoryCache.has('test-key')).toBe(false)
    })

    it('should clear all data', () => {
      memoryCache.set('key1', 'value1')
      memoryCache.set('key2', 'value2')
      
      expect(memoryCache.size()).toBe(2)
      
      memoryCache.clear()
      
      expect(memoryCache.size()).toBe(0)
    })

    it('should return cache statistics', () => {
      memoryCache.set('key1', 'value1')
      memoryCache.set('key2', 'value2')
      
      const stats = memoryCache.getStats()
      
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBeGreaterThan(0)
    })
  })

  describe('Cache Key Generation', () => {
    it('should generate cache keys correctly', () => {
      const key = generateCacheKey('products', 'category', 'electronics')
      expect(key).toBe('products:category:electronics')
    })

    it('should generate product cache keys', () => {
      const key = generateProductCacheKey('123')
      expect(key).toBe('product:123')
    })

    it('should generate products cache keys with filters', () => {
      const filters = { category: 'electronics', page: 1, limit: 10 }
      const key = generateProductsCacheKey(filters)
      expect(key).toContain('products:')
      expect(key).toContain('category=electronics')
      expect(key).toContain('page=1')
    })

    it('should generate consistent keys for same filters', () => {
      const filters1 = { category: 'electronics', page: 1 }
      const filters2 = { page: 1, category: 'electronics' }
      
      const key1 = generateProductsCacheKey(filters1)
      const key2 = generateProductsCacheKey(filters2)
      
      expect(key1).toBe(key2)
    })
  })

  describe('getCachedData', () => {
    it('should fetch and cache data', async () => {
      const mockData = { id: 1, name: 'Test Product' }
      const fetcher = jest.fn().mockResolvedValue(mockData)
      
      const result = await getCachedData('test-key', fetcher)
      
      expect(result).toEqual(mockData)
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(memoryCache.get('test-key')).toEqual(mockData)
    })

    it('should return cached data on subsequent calls', async () => {
      const mockData = { id: 1, name: 'Test Product' }
      const fetcher = jest.fn().mockResolvedValue(mockData)
      
      // First call
      const result1 = await getCachedData('test-key', fetcher)
      
      // Second call
      const result2 = await getCachedData('test-key', fetcher)
      
      expect(result1).toEqual(mockData)
      expect(result2).toEqual(mockData)
      expect(fetcher).toHaveBeenCalledTimes(1) // Should only be called once
    })

    it('should handle fetcher errors', async () => {
      const error = new Error('Fetch failed')
      const fetcher = jest.fn().mockRejectedValue(error)
      
      await expect(getCachedData('test-key', fetcher)).rejects.toThrow('Fetch failed')
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate cache tags', async () => {
      const { revalidateTag } = require('next/cache')
      
      await invalidateCache(CACHE_TAGS.PRODUCTS)
      
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.PRODUCTS)
    })

    it('should invalidate multiple cache tags', async () => {
      const { revalidateTag } = require('next/cache')
      const tags = [CACHE_TAGS.PRODUCTS, CACHE_TAGS.CATEGORIES]
      
      await invalidateCache(tags)
      
      expect(revalidateTag).toHaveBeenCalledTimes(2)
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.PRODUCTS)
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.CATEGORIES)
    })

    it('should invalidate product-related caches', async () => {
      const { revalidateTag } = require('next/cache')
      
      // Set some cached data
      memoryCache.set(generateProductCacheKey('123'), { id: '123', name: 'Test' })
      
      await invalidateProduct('123')
      
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.PRODUCT)
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.PRODUCTS)
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.CATEGORIES)
      expect(memoryCache.get(generateProductCacheKey('123'))).toBeNull()
    })
  })

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      memoryCache.set('key1', 'value1')
      memoryCache.set('key2', 'value2')
      
      const stats = getCacheStats()
      
      expect(stats.memory.size).toBe(2)
      expect(stats.timestamp).toBeTruthy()
      expect(new Date(stats.timestamp)).toBeInstanceOf(Date)
    })
  })
})