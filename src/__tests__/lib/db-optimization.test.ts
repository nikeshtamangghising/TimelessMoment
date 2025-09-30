import { DatabaseOptimizer, QueryMonitor } from '@/lib/db-optimization'

describe('DatabaseOptimizer', () => {
  beforeEach(() => {
    DatabaseOptimizer.clearQueryCache()
  })

  describe('cachedQuery', () => {
    it('should cache query results', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1, name: 'Test' })
      
      // First call
      const result1 = await DatabaseOptimizer.cachedQuery('test-query', mockQuery)
      
      // Second call
      const result2 = await DatabaseOptimizer.cachedQuery('test-query', mockQuery)
      
      expect(result1).toEqual({ id: 1, name: 'Test' })
      expect(result2).toEqual({ id: 1, name: 'Test' })
      expect(mockQuery).toHaveBeenCalledTimes(1) // Should only be called once
    })

    it('should respect TTL and refetch after expiration', async () => {
      const mockQuery = jest.fn()
        .mockResolvedValueOnce({ id: 1, name: 'Test 1' })
        .mockResolvedValueOnce({ id: 2, name: 'Test 2' })
      
      const shortTTL = 50 // 50ms
      
      // First call
      const result1 = await DatabaseOptimizer.cachedQuery('test-query', mockQuery, shortTTL)
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 60))
      
      // Second call after expiration
      const result2 = await DatabaseOptimizer.cachedQuery('test-query', mockQuery, shortTTL)
      
      expect(result1).toEqual({ id: 1, name: 'Test 1' })
      expect(result2).toEqual({ id: 2, name: 'Test 2' })
      expect(mockQuery).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearQueryCache', () => {
    it('should clear all cache when no pattern provided', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ id: 1 })
      
      // Cache some data
      await DatabaseOptimizer.cachedQuery('query1', mockQuery)
      await DatabaseOptimizer.cachedQuery('query2', mockQuery)
      
      // Clear all cache
      DatabaseOptimizer.clearQueryCache()
      
      // Should refetch after clearing
      await DatabaseOptimizer.cachedQuery('query1', mockQuery)
      
      expect(mockQuery).toHaveBeenCalledTimes(3) // 2 initial + 1 after clear
    })

    it('should clear cache by pattern', async () => {
      const mockQuery1 = jest.fn().mockResolvedValue({ id: 1 })
      const mockQuery2 = jest.fn().mockResolvedValue({ id: 2 })
      
      // Cache some data
      await DatabaseOptimizer.cachedQuery('product:123', mockQuery1)
      await DatabaseOptimizer.cachedQuery('user:456', mockQuery2)
      
      // Clear only product cache
      DatabaseOptimizer.clearQueryCache('product')
      
      // Product query should refetch, user query should use cache
      await DatabaseOptimizer.cachedQuery('product:123', mockQuery1)
      await DatabaseOptimizer.cachedQuery('user:456', mockQuery2)
      
      expect(mockQuery1).toHaveBeenCalledTimes(2) // Initial + after clear
      expect(mockQuery2).toHaveBeenCalledTimes(1) // Only initial
    })
  })

  describe('paginateWithCursor', () => {
    it('should return paginated results with cursor', async () => {
      const mockModel = {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
          { id: '3', name: 'Item 3' },
        ])
      }

      const result = await DatabaseOptimizer.paginateWithCursor(mockModel, {
        take: 2,
        where: { active: true },
        orderBy: { createdAt: 'desc' }
      })

      expect(result.data).toHaveLength(2)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBe('2')
      expect(mockModel.findMany).toHaveBeenCalledWith({
        take: 3, // take + 1
        cursor: undefined,
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        select: undefined,
        include: undefined,
      })
    })

    it('should handle last page correctly', async () => {
      const mockModel = {
        findMany: jest.fn().mockResolvedValue([
          { id: '1', name: 'Item 1' },
        ])
      }

      const result = await DatabaseOptimizer.paginateWithCursor(mockModel, {
        take: 2,
      })

      expect(result.data).toHaveLength(1)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeUndefined()
    })
  })
})

describe('QueryMonitor', () => {
  beforeEach(() => {
    // Clear query history
    QueryMonitor['queries'] = []
  })

  describe('logQuery', () => {
    it('should log query with duration', () => {
      QueryMonitor.logQuery('SELECT * FROM products', 150, { limit: 10 })
      
      const stats = QueryMonitor.getQueryStats()
      expect(stats.total).toBe(1)
      expect(stats.averageDuration).toBe(150)
    })

    it('should warn about slow queries', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      QueryMonitor.logQuery('SLOW SELECT', 2000) // 2 seconds
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow query detected'),
        'SLOW SELECT',
        undefined
      )
      
      consoleSpy.mockRestore()
    })

    it('should limit query history to 1000 entries', () => {
      // Add 1100 queries
      for (let i = 0; i < 1100; i++) {
        QueryMonitor.logQuery(`query-${i}`, 100)
      }
      
      const stats = QueryMonitor.getQueryStats()
      expect(stats.total).toBe(1000)
    })
  })

  describe('getSlowQueries', () => {
    it('should return queries above threshold', () => {
      QueryMonitor.logQuery('fast-query', 100)
      QueryMonitor.logQuery('slow-query-1', 600)
      QueryMonitor.logQuery('slow-query-2', 800)
      
      const slowQueries = QueryMonitor.getSlowQueries(500)
      
      expect(slowQueries).toHaveLength(2)
      expect(slowQueries[0].query).toBe('slow-query-1')
      expect(slowQueries[1].query).toBe('slow-query-2')
    })
  })

  describe('getQueryStats', () => {
    it('should return correct statistics', () => {
      QueryMonitor.logQuery('query-1', 100)
      QueryMonitor.logQuery('query-2', 200)
      QueryMonitor.logQuery('query-3', 600) // Slow query
      
      const stats = QueryMonitor.getQueryStats()
      
      expect(stats.total).toBe(3)
      expect(stats.averageDuration).toBe(300) // (100 + 200 + 600) / 3
      expect(stats.slowQueries).toBe(1) // Only query-3 is > 500ms
    })

    it('should handle empty query history', () => {
      const stats = QueryMonitor.getQueryStats()
      
      expect(stats.total).toBe(0)
      expect(stats.averageDuration).toBe(0)
      expect(stats.slowQueries).toBe(0)
      expect(stats.recentQueries).toBe(0)
    })
  })
})