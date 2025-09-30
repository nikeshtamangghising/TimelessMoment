import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getCacheStats, 
  invalidateCache, 
  invalidatePath,
  memoryCache,
  CACHE_TAGS,
  preloadCriticalData 
} from '@/lib/cache'
import { DatabaseOptimizer, QueryMonitor } from '@/lib/db-optimization'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Get cache statistics
      const cacheStats = getCacheStats()
      const queryStats = QueryMonitor.getQueryStats()
      const slowQueries = QueryMonitor.getSlowQueries(1000) // Queries over 1 second

      return NextResponse.json({
        cache: cacheStats,
        database: {
          queries: queryStats,
          slowQueries: slowQueries.slice(-10), // Last 10 slow queries
        },
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      message: 'Cache management API',
      availableActions: [
        'GET ?action=stats - Get cache statistics',
        'POST - Manage cache operations',
        'DELETE - Clear cache',
      ],
    })

  } catch (error) {
    console.error('Cache management error:', error)
    return NextResponse.json(
      { error: 'Failed to get cache information' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, target, path } = body

    switch (action) {
      case 'invalidate':
        if (target === 'all') {
          // Invalidate all cache tags
          await Promise.all([
            invalidateCache(Object.values(CACHE_TAGS)),
            memoryCache.clear(),
            DatabaseOptimizer.clearQueryCache(),
          ])
          
          return NextResponse.json({
            message: 'All caches invalidated successfully',
          })
        } else if (target && Object.values(CACHE_TAGS).includes(target)) {
          await invalidateCache(target)
          DatabaseOptimizer.clearQueryCache(target)
          
          return NextResponse.json({
            message: `Cache tag '${target}' invalidated successfully`,
          })
        } else {
          return NextResponse.json(
            { error: 'Invalid target. Use "all" or a valid cache tag.' },
            { status: 400 }
          )
        }

      case 'invalidate-path':
        if (!path) {
          return NextResponse.json(
            { error: 'Path is required for path invalidation' },
            { status: 400 }
          )
        }
        
        await invalidatePath(path)
        
        return NextResponse.json({
          message: `Path '${path}' invalidated successfully`,
        })

      case 'preload':
        await preloadCriticalData()
        
        return NextResponse.json({
          message: 'Critical data preloaded successfully',
        })

      case 'warm':
        // Warm up specific caches
        const operations = []
        
        if (target === 'products' || target === 'all') {
          operations.push(
            import('@/lib/product-repository').then(({ productRepository }) =>
              productRepository.findMany({ isActive: true }, { page: 1, limit: 20 })
            )
          )
        }
        
        if (target === 'categories' || target === 'all') {
          operations.push(
            import('@/lib/product-repository').then(({ productRepository }) =>
              productRepository.getCategories()
            )
          )
        }

        await Promise.allSettled(operations)
        
        return NextResponse.json({
          message: `Cache warmed for target: ${target || 'all'}`,
          operations: operations.length,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: invalidate, invalidate-path, preload, warm' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Cache operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform cache operation' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const target = searchParams.get('target') || 'all'

    if (target === 'memory') {
      memoryCache.clear()
      return NextResponse.json({
        message: 'Memory cache cleared successfully',
      })
    }

    if (target === 'database') {
      DatabaseOptimizer.clearQueryCache()
      return NextResponse.json({
        message: 'Database query cache cleared successfully',
      })
    }

    if (target === 'all') {
      // Clear all caches
      await Promise.all([
        invalidateCache(Object.values(CACHE_TAGS)),
        memoryCache.clear(),
        DatabaseOptimizer.clearQueryCache(),
      ])
      
      return NextResponse.json({
        message: 'All caches cleared successfully',
      })
    }

    return NextResponse.json(
      { error: 'Invalid target. Use "memory", "database", or "all".' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}