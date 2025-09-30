import { prisma } from './db'
import { 
  CreateProductInput, 
  UpdateProductInput, 
  PaginationInput, 
  ProductFiltersInput 
} from './validations'
import type { 
  Product, 
  PaginatedResponse 
} from '@/types'
import {
  getCachedData,
  generateProductCacheKey,
  generateProductsCacheKey,
  invalidateProduct,
  invalidateProducts,
  CACHE_TAGS,
  CACHE_DURATIONS,
  createCachedFunction,
} from './cache'

export class ProductRepository {
  async create(data: CreateProductInput): Promise<Product> {
    const product = await prisma.product.create({
      data,
    })

    // Invalidate related caches
    await invalidateProducts()

    return product
  }

  async findById(id: string): Promise<Product | null> {
    const cacheKey = generateProductCacheKey(id)
    
    return getCachedData(
      cacheKey,
      () => prisma.product.findUnique({
        where: { id },
      }),
      {
        memoryTtl: CACHE_DURATIONS.MEDIUM,
        nextjsTags: [CACHE_TAGS.PRODUCT, `${CACHE_TAGS.PRODUCT}:${id}`],
        nextjsRevalidate: CACHE_DURATIONS.LONG,
      }
    )
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const cacheKey = `product:slug:${slug}`
    
    return getCachedData(
      cacheKey,
      () => prisma.product.findUnique({
        where: { slug },
      }),
      {
        memoryTtl: CACHE_DURATIONS.MEDIUM,
        nextjsTags: [CACHE_TAGS.PRODUCT, `${CACHE_TAGS.PRODUCT}:slug:${slug}`],
        nextjsRevalidate: CACHE_DURATIONS.LONG,
      }
    )
  }

  async findMany(
    filters: ProductFiltersInput = {},
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<Product>> {
    const cacheKey = generateProductsCacheKey({ ...filters, ...pagination })
    
    return getCachedData(
      cacheKey,
      async () => {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where = this.buildWhereClause(filters)

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.product.count({ where }),
        ])

        return {
          data: products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }
      },
      {
        memoryTtl: CACHE_DURATIONS.SHORT,
        nextjsTags: [CACHE_TAGS.PRODUCTS],
        nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
      }
    )
  }

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data,
    })

    // Invalidate related caches
    await invalidateProduct(id)

    return product
  }

  async delete(id: string): Promise<Product> {
    const product = await prisma.product.delete({
      where: { id },
    })

    // Invalidate related caches
    await invalidateProduct(id)

    return product
  }

  async updateInventory(id: string, quantity: number): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        inventory: {
          decrement: quantity,
        },
      },
    })
  }

  async checkAvailability(id: string, quantity: number): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { inventory: true, isActive: true },
    })

    return product ? product.isActive && product.inventory >= quantity : false
  }

  async getCategories(): Promise<string[]> {
    return getCachedData(
      'categories',
      async () => {
        const result = await prisma.product.findMany({
          select: { category: true },
          distinct: ['category'],
          where: { isActive: true },
        })

        return result.map(item => item.category)
      },
      {
        memoryTtl: CACHE_DURATIONS.LONG,
        nextjsTags: [CACHE_TAGS.CATEGORIES],
        nextjsRevalidate: CACHE_DURATIONS.VERY_LONG,
      }
    )
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        inventory: {
          lte: threshold,
        },
        isActive: true,
      },
      orderBy: { inventory: 'asc' },
    })
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return getCachedData(
      `featured-products:${limit}`,
      () => prisma.product.findMany({
        where: { 
          isActive: true,
          inventory: { gt: 0 }
        },
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
      }),
      {
        memoryTtl: CACHE_DURATIONS.MEDIUM,
        nextjsTags: [CACHE_TAGS.PRODUCTS, 'featured-products'],
        nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
      }
    )
  }

  async getPopularProducts(limit: number = 6): Promise<Product[]> {
    return getCachedData(
      `popular-products:${limit}`,
      () => prisma.product.findMany({
        where: { 
          isActive: true,
          inventory: { gt: 0 }
        },
        // In a real app, you'd order by view count, sales, etc.
        // For now, we'll use a combination of factors
        orderBy: [
          { price: 'desc' }, // Higher priced items as "popular"
          { createdAt: 'desc' }
        ],
        take: limit,
      }),
      {
        memoryTtl: CACHE_DURATIONS.MEDIUM,
        nextjsTags: [CACHE_TAGS.PRODUCTS, 'popular-products'],
        nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
      }
    )
  }

  async getNewArrivals(limit: number = 6): Promise<Product[]> {
    return getCachedData(
      `new-arrivals:${limit}`,
      () => prisma.product.findMany({
        where: { 
          isActive: true,
          inventory: { gt: 0 }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      {
        memoryTtl: CACHE_DURATIONS.SHORT,
        nextjsTags: [CACHE_TAGS.PRODUCTS, 'new-arrivals'],
        nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
      }
    )
  }

  async getTrendingProducts(limit: number = 8): Promise<Product[]> {
    return getCachedData(
      `trending-products:${limit}`,
      () => prisma.product.findMany({
        where: { 
          isActive: true,
          inventory: { gt: 0 }
        },
        // In a real app, you'd have analytics data to determine trending
        // For now, we'll use recent products with good inventory
        orderBy: [
          { inventory: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
      }),
      {
        memoryTtl: CACHE_DURATIONS.MEDIUM,
        nextjsTags: [CACHE_TAGS.PRODUCTS, 'trending-products'],
        nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
      }
    )
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 8): Promise<Product[]> {
    // In a real app, this would use ML algorithms, user behavior, purchase history, etc.
    // For now, we'll implement a simple recommendation based on user's order history
    
    return getCachedData(
      `recommendations:${userId}:${limit}`,
      async () => {
        // Get user's order history to understand preferences
        const userOrders = await prisma.order.findMany({
          where: { userId },
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 orders
        })

        // Extract categories from user's purchase history
        const purchasedCategories = new Set<string>()
        userOrders.forEach(order => {
          order.items.forEach(item => {
            if (item.product) {
              purchasedCategories.add(item.product.category)
            }
          })
        })

        // Get products from preferred categories
        if (purchasedCategories.size > 0) {
          return prisma.product.findMany({
            where: {
              isActive: true,
              inventory: { gt: 0 },
              category: { in: Array.from(purchasedCategories) },
              // Exclude products user already bought
              NOT: {
                id: {
                  in: userOrders.flatMap(order => 
                    order.items.map(item => item.productId)
                  )
                }
              }
            },
            orderBy: [
              { createdAt: 'desc' },
              { price: 'asc' }
            ],
            take: limit,
          })
        }

        // Fallback to trending products if no purchase history
        return this.getTrendingProducts(limit)
      },
      {
        memoryTtl: CACHE_DURATIONS.SHORT, // Shorter cache for personalized content
        nextjsTags: [CACHE_TAGS.PRODUCTS, `recommendations:${userId}`],
        nextjsRevalidate: CACHE_DURATIONS.SHORT,
      }
    )
  }

  async getProductsByCategory(category: string, limit: number = 12): Promise<Product[]> {
    return getCachedData(
      `category-products:${category}:${limit}`,
      () => prisma.product.findMany({
        where: {
          category,
          isActive: true,
          inventory: { gt: 0 }
        },
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
      }),
      {
        memoryTtl: CACHE_DURATIONS.MEDIUM,
        nextjsTags: [CACHE_TAGS.PRODUCTS, `category:${category}`],
        nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
      }
    )
  }

  private buildWhereClause(filters: ProductFiltersInput) {
    const where: any = {}

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.minPrice !== undefined) {
      where.price = { ...where.price, gte: filters.minPrice }
    }

    if (filters.maxPrice !== undefined) {
      where.price = { ...where.price, lte: filters.maxPrice }
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    return where
  }
}

// Export singleton instance
export const productRepository = new ProductRepository()

// Export function to get repository instance
export function getProductRepository(): ProductRepository {
  return productRepository
}