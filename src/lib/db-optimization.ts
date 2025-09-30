import { Prisma } from '@prisma/client'
import { prisma } from './db-utils'

// Database connection optimization
export class DatabaseOptimizer {
  private static queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>()
  private static readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  // Query result caching
  static async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(queryKey)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result
    }

    const result = await queryFn()
    
    this.queryCache.set(queryKey, {
      result,
      timestamp: Date.now(),
      ttl,
    })

    return result
  }

  // Clear query cache
  static clearQueryCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key)
        }
      }
    } else {
      this.queryCache.clear()
    }
  }

  // Batch operations
  static async batchCreate<T>(
    model: any,
    data: T[],
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      await model.createMany({
        data: batch,
        skipDuplicates: true,
      })
    }
  }

  // Optimized pagination
  static async paginateWithCursor<T>(
    model: any,
    options: {
      cursor?: any
      take: number
      where?: any
      orderBy?: any
      select?: any
      include?: any
    }
  ): Promise<{ data: T[]; nextCursor?: any; hasMore: boolean }> {
    const { cursor, take, where, orderBy, select, include } = options
    
    const items = await model.findMany({
      take: take + 1, // Take one extra to check if there are more
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy,
      select,
      include,
    })

    const hasMore = items.length > take
    const data = hasMore ? items.slice(0, -1) : items
    const nextCursor = hasMore ? items[items.length - 2]?.id : undefined

    return { data, nextCursor, hasMore }
  }
}

// Query performance monitoring
export class QueryMonitor {
  private static queries: Array<{
    query: string
    duration: number
    timestamp: Date
    params?: any
  }> = []

  static logQuery(query: string, duration: number, params?: any): void {
    this.queries.push({
      query,
      duration,
      timestamp: new Date(),
      params,
    })

    // Keep only last 1000 queries
    if (this.queries.length > 1000) {
      this.queries = this.queries.slice(-1000)
    }

    // Log slow queries
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow query detected (${duration}ms):`, query, params)
    }
  }

  static getSlowQueries(threshold: number = 500): typeof this.queries {
    return this.queries.filter(q => q.duration > threshold)
  }

  static getQueryStats(): {
    total: number
    averageDuration: number
    slowQueries: number
    recentQueries: number
  } {
    const total = this.queries.length
    const averageDuration = total > 0 
      ? this.queries.reduce((sum, q) => sum + q.duration, 0) / total 
      : 0
    const slowQueries = this.queries.filter(q => q.duration > 500).length
    const recentQueries = this.queries.filter(
      q => Date.now() - q.timestamp.getTime() < 60000 // Last minute
    ).length

    return {
      total,
      averageDuration: Math.round(averageDuration),
      slowQueries,
      recentQueries,
    }
  }
}

// Database middleware for performance monitoring
export function createPerformanceMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const start = Date.now()
    const result = await next(params)
    const duration = Date.now() - start

    QueryMonitor.logQuery(
      `${params.model}.${params.action}`,
      duration,
      params.args
    )

    return result
  }
}

// Connection pool optimization
export function optimizeConnectionPool(): void {
  // These would typically be set in DATABASE_URL or Prisma configuration
  const recommendations = {
    connectionLimit: Math.max(5, Math.min(20, Math.floor(process.env.NODE_ENV === 'production' ? 10 : 5))),
    poolTimeout: 60000, // 60 seconds
    idleTimeout: 600000, // 10 minutes
  }

  console.log('Database connection pool recommendations:', recommendations)
}