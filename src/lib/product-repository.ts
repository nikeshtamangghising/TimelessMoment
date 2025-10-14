import { prisma, Prisma } from './db'
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
      data: data as any,
    })

    // Invalidate related caches
    await invalidateProducts()

    return product
  }

  async findById(id: string): Promise<Product | null> {
    // TEMPORARY FIX: Disable caching to see if that resolves the issue
    // const cacheKey = generateProductCacheKey(id)
    // 
    // return getCachedData(
    //   cacheKey,
    //   () => prisma.product.findUnique({
    //     where: { id },
    //     include: {
    //       category: true,
    //       brand: true,
    //     },
    //   }),
    //   {
    //     memoryTtl: CACHE_DURATIONS.MEDIUM,
    //     nextjsTags: [CACHE_TAGS.PRODUCT, `${CACHE_TAGS.PRODUCT}:${id}`],
    //     nextjsRevalidate: CACHE_DURATIONS.LONG,
    //   }
    // )
    
    // Direct database call without caching
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        attributes: true,
      },
    })
  }

  async findBySlug(slug: string): Promise<Product | null> {
    // TEMPORARY FIX: Disable caching to see if that resolves the issue
    // const cacheKey = `product:slug:${slug}`
    // 
    // return getCachedData(
    //   cacheKey,
    //   () => prisma.product.findUnique({
    //     where: { slug },
    //     include: {
    //       category: true,
    //       brand: true,
    //     },
    //   }),
    //   {
    //     memoryTtl: CACHE_DURATIONS.MEDIUM,
    //     nextjsTags: [CACHE_TAGS.PRODUCT, `${CACHE_TAGS.PRODUCT}:slug:${slug}`],
    //     nextjsRevalidate: CACHE_DURATIONS.LONG,
    //   }
    // )
    
    // Direct database call without caching
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        attributes: true,
      },
    })
  }

  async findBySku(sku: string): Promise<Product | null> {
    // TEMPORARY FIX: Disable caching to see if that resolves the issue
    // const cacheKey = `product:sku:${sku}`
    // 
    // return getCachedData(
    //   cacheKey,
    //   () => prisma.product.findUnique({
    //     where: { sku },
    //     include: {
    //     category: true,
    //       brand: true,
    //     },
    //   }),
    //   {
    //     memoryTtl: CACHE_DURATIONS.MEDIUM,
    //     nextjsTags: [CACHE_TAGS.PRODUCT, `${CACHE_TAGS.PRODUCT}:sku:${sku}`],
    //     nextjsRevalidate: CACHE_DURATIONS.LONG,
    //   }
    // )
    
    // Direct database call without caching
    return prisma.product.findUnique({
      where: { sku },
      include: {
        category: true,
        brand: true,
      },
    })
  }

  async findMany(
    filters: ProductFiltersInput = {},
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<Product>> {
    // TEMPORARY FIX: Disable caching to see if that resolves the issue
    // const cacheKey = generateProductsCacheKey({ ...filters, ...pagination })
    // 
    // return getCachedData(
    //   cacheKey,
    //   async () => {
    //     const { page, limit } = pagination
    //     const skip = (page - 1) * limit
    //
    //     const where = this.buildWhereClause(filters)
    //
    //     const orderBy = this.buildOrderBy(filters.sort)
    //     
    //     const [products, total] = await Promise.all([
    //       prisma.product.findMany({
    //         where,
    //         skip,
    //         take: limit,
    //         include: {
    //           category: true,
    //           brand: true,
    //         },
    //         orderBy,
    //       }),
    //       prisma.product.count({ where }),
    //     ])
    //
    //     return {
    //       data: products,
    //       pagination: {
    //         page,
    //         limit,
    //         total,
    //         totalPages: Math.ceil(total / limit),
    //       },
    //     }
    //   },
    //   {
    //     memoryTtl: CACHE_DURATIONS.SHORT,
    //     nextjsTags: [CACHE_TAGS.PRODUCTS],
    //     nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
    //   }
    // )
    
    // Direct database call without caching
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where = this.buildWhereClause(filters)

    const orderBy = this.buildOrderBy(filters.sort)
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          price: true,
          discountPrice: true,
          currency: true,
          images: true,
          inventory: true,
          lowStockThreshold: true,
          popularityScore: true,
          isActive: true,
          isFeatured: true,
          isNewArrival: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: orderBy as any,
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
  }

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: data as any,
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
    // TEMPORARY FIX: Disable caching to see if that resolves the issue
    // return getCachedData(
    //   'categories',
    //   async () => {
    //     const result = await prisma.category.findMany({
    //       where: { 
    //         isActive: true,
    //         products: {
    //           some: {
    //             isActive: true
    //           }
    //         }
    //       },
    //       select: { name: true },
    //       orderBy: { name: 'asc' }
    //     })
    //
    //     return result.map(item => item.name)
    //   },
    //   {
    //     memoryTtl: CACHE_DURATIONS.LONG,
    //     nextjsTags: [CACHE_TAGS.CATEGORIES],
    //     nextjsRevalidate: CACHE_DURATIONS.VERY_LONG,
    //   }
    // )
    
    // Direct database call without caching
    const result = await prisma.category.findMany({
      where: { 
        isActive: true,
        products: {
          some: {
            isActive: true
          }
        }
      },
      select: { name: true },
      orderBy: { name: 'asc' }
    })

    return result.map(item => item.name)
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
    return prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  async getNewArrivals(limit: number = 8): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        isNewArrival: true,
        isActive: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  async getRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        id: { not: productId },
        categoryId,
        isActive: true,
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
    })
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
    })
  }

  async incrementViewCount(productId: string): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: {
        viewCount: { increment: 1 },
        lastScoreUpdate: new Date(),
      },
    })
  }

  async updatePopularityScores(): Promise<void> {
    // Update popularity scores for all products
    // This could be called periodically via cron job
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        viewCount: true,
        orderCount: true,
        favoriteCount: true,
        cartCount: true,
        purchaseCount: true,
        ratingAvg: true,
        ratingCount: true,
        lastScoreUpdate: true,
      },
    })

    // Calculate and update popularity scores
    for (const product of products) {
      // Simple popularity algorithm (can be made more sophisticated)
      const popularityScore = 
        (product.viewCount * 0.1) +
        (product.orderCount * 2) +
        (product.favoriteCount * 1.5) +
        (product.cartCount * 0.5) +
        (product.purchaseCount * 3) +
        ((product.ratingAvg || 0) * product.ratingCount * 0.5)
      
      await prisma.product.update({
        where: { id: product.id },
        data: {
          popularityScore,
          lastScoreUpdate: new Date(),
        },
      })
    }
  }

  async getPopularProducts(limit: number = 8): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        isActive: true,
      },
      take: limit,
      orderBy: { popularityScore: 'desc' },
    })
  }

  private buildWhereClause(filters: ProductFiltersInput) {
    const where: any = {
      isActive: true,
    }

    if (filters.category) {
      where.categoryId = filters.category
    }

    if (filters.minPrice !== undefined) {
      where.price = { gte: filters.minPrice }
    }

    if (filters.maxPrice !== undefined) {
      where.price = where.price ? { ...where.price, lte: filters.maxPrice } : { lte: filters.maxPrice }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ]
    }

    if (filters.lowStock) {
      where.AND = where.AND || [];
      where.AND.push({ inventory: { gt: 0 } });
      where.AND.push({ inventory: { lte: Prisma.raw('"lowStockThreshold"') } });
    }

    if (filters.outOfStock) {
      where.inventory = 0;
    }

    return where
  }

  private buildOrderBy(sort?: string) {
    switch (sort) {
      case 'price-asc':
        return { price: 'asc' as const }
      case 'price-desc':
        return { price: 'desc' as const }
      case 'name-asc':
        return { name: 'asc' as const }
      case 'name-desc':
        return { name: 'desc' as const }
      case 'newest':
        return { createdAt: 'desc' as const }
      case 'popular':
        return { popularityScore: 'desc' as const }
      case 'trending':
        // Approximate trending by popularity score for listing purposes
        // (True trending is computed in recommendations API based on recent activity)
        return { popularityScore: 'desc' as const }
      case 'rating':
        return { ratingAvg: 'desc' as const }
      default:
        return { createdAt: 'desc' as const }
    }
  }
}

// Create and export a singleton instance
export const productRepository = new ProductRepository()

// Export singleton getter function for consistency with other repositories
export const getProductRepository = () => productRepository
