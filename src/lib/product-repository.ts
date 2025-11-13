import { db } from './db'
import { products, categories, brands, productAttributes } from './db/schema'
import { eq, and, or, gte, lte, ne, desc, asc, sql, inArray, ilike } from 'drizzle-orm'
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
    const insertResult = await db.insert(products)
      .values(data as any)
      .returning();

    // Invalidate related caches
    await invalidateProducts()

    return insertResult[0] as Product;
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
    return await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
        brand: true,
        attributes: true,
      },
    }) as Product | null
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
    
    // Optimized query - only fetch essential relations for initial load
    return await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true
          }
        },
        brand: {
          columns: {
            id: true,
            name: true,
            slug: true
          }
        },
        attributes: {
          columns: {
            id: true,
            name: true,
            value: true
          },
          limit: 10 // Limit attributes to reduce data transfer
        },
      },
    }) as Product | null
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
    return await db.query.products.findFirst({
      where: eq(products.sku, sku!),
      with: {
        category: true,
        brand: true,
      },
    }) as Product | null
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
    
    // Optimized: Fetch products and count in parallel, but only essential columns
    const [productsResult, totalResult] = await Promise.all([
      db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        discountPrice: products.discountPrice,
        currency: products.currency,
        images: products.images,
        inventory: products.inventory,
        popularityScore: products.popularityScore,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        isNewArrival: products.isNewArrival,
        category: {
          id: categories.id,
          name: categories.name,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(skip),
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(where),
    ])
    
    const total = Number(totalResult[0]?.count || 0)

    return {
      data: productsResult as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const updateResult = await db.update(products)
      .set(data as any)
      .where(eq(products.id, id))
      .returning();

    // Invalidate related caches
    await invalidateProduct(id)

    return updateResult[0] as Product;
  }

  async delete(id: string): Promise<Product> {
    const deleteResult = await db.delete(products)
      .where(eq(products.id, id))
      .returning();

    // Invalidate related caches
    await invalidateProduct(id)

    return deleteResult[0] as Product;
  }

  async updateInventory(id: string, quantity: number): Promise<Product> {
    const updateResult = await db.update(products)
      .set({ inventory: sql`${products.inventory} - ${quantity}` })
      .where(eq(products.id, id))
      .returning();
    
    return updateResult[0] as Product;
  }

  async checkAvailability(id: string, quantity: number): Promise<boolean> {
    const productResult = await db.select({ 
      inventory: products.inventory, 
      isActive: products.isActive 
    })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

    const product = productResult[0];
    return product ? product.isActive && product.inventory >= quantity : false;
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
    const result = await db.selectDistinct({ name: categories.name })
      .from(categories)
      .innerJoin(products, eq(categories.id, products.categoryId))
      .where(and(
        eq(categories.isActive, true),
        eq(products.isActive, true)
      ))
      .orderBy(asc(categories.name));

    return result.map(item => item.name);
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return await db.query.products.findMany({
      where: and(
        lte(products.inventory, threshold),
        eq(products.isActive, true)
      ),
      orderBy: asc(products.inventory),
    }) as Product[];
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return await db.query.products.findMany({
      where: and(
        eq(products.isFeatured, true),
        eq(products.isActive, true)
      ),
      limit,
      orderBy: desc(products.createdAt),
    }) as Product[];
  }

  async getNewArrivals(limit: number = 8): Promise<Product[]> {
    return await db.query.products.findMany({
      where: and(
        eq(products.isNewArrival, true),
        eq(products.isActive, true)
      ),
      limit,
      orderBy: desc(products.createdAt),
    }) as Product[];
  }

  async getRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<Product[]> {
    return await db.query.products.findMany({
      where: and(
        ne(products.id, productId),
        eq(products.categoryId, categoryId),
        eq(products.isActive, true)
      ),
      limit,
      orderBy: desc(products.viewCount),
    }) as Product[];
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    return await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.description, `%${query}%`),
          sql`${products.tags} @> ARRAY[${query}]::text[]`
        )
      ),
      limit,
      orderBy: desc(products.viewCount),
    }) as Product[];
  }

  async incrementViewCount(productId: string): Promise<void> {
    await db.update(products)
      .set({ 
        viewCount: sql`${products.viewCount} + 1`,
        lastScoreUpdate: new Date(),
      })
      .where(eq(products.id, productId));
  }

  async updatePopularityScores(): Promise<void> {
    // Update popularity scores for all products
    // This could be called periodically via cron job
    const productsResult = await db.select({
      id: products.id,
      viewCount: products.viewCount,
      orderCount: products.orderCount,
      favoriteCount: products.favoriteCount,
      cartCount: products.cartCount,
      purchaseCount: products.purchaseCount,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      lastScoreUpdate: products.lastScoreUpdate,
    })
    .from(products)
    .where(eq(products.isActive, true));

    // Calculate and update popularity scores
    for (const product of productsResult) {
      // Simple popularity algorithm (can be made more sophisticated)
      const popularityScore = 
        (product.viewCount * 0.1) +
        (product.orderCount * 2) +
        (product.favoriteCount * 1.5) +
        (product.cartCount * 0.5) +
        (product.purchaseCount * 3) +
        ((parseFloat(product.ratingAvg || '0')) * product.ratingCount * 0.5);
      
      await db.update(products)
        .set({
          popularityScore: popularityScore.toString(),
          lastScoreUpdate: new Date(),
        })
        .where(eq(products.id, product.id));
    }
  }

  async getPopularProducts(limit: number = 8): Promise<Product[]> {
    return await db.query.products.findMany({
      where: eq(products.isActive, true),
      limit,
      orderBy: desc(products.popularityScore),
    }) as Product[];
  }

  private buildWhereClause(filters: ProductFiltersInput) {
    const conditions: any[] = [eq(products.isActive, true)];

    if (filters.category) {
      conditions.push(eq(products.categoryId, filters.category));
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(products.price, filters.minPrice.toString()));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(products.price, filters.maxPrice.toString()));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(products.name, `%${filters.search}%`),
          ilike(products.description, `%${filters.search}%`),
          sql`${products.tags} @> ARRAY[${filters.search}]::text[]`
        )!
      );
    }

    if (filters.lowStock) {
      conditions.push(sql`${products.inventory} > 0`);
      conditions.push(sql`${products.inventory} <= ${products.lowStockThreshold}`);
    }

    if (filters.outOfStock) {
      conditions.push(eq(products.inventory, 0));
    }

    return and(...conditions);
  }

  private buildOrderBy(sort?: string) {
    switch (sort) {
      case 'price-asc':
        return asc(products.price);
      case 'price-desc':
        return desc(products.price);
      case 'name-asc':
        return asc(products.name);
      case 'name-desc':
        return desc(products.name);
      case 'newest':
        return desc(products.createdAt);
      case 'popular':
        return desc(products.popularityScore);
      case 'trending':
        // Approximate trending by popularity score for listing purposes
        // (True trending is computed in recommendations API based on recent activity)
        return desc(products.popularityScore);
      case 'rating':
        return desc(products.ratingAvg);
      default:
        return desc(products.createdAt);
    }
  }
}

// Create and export a singleton instance
export const productRepository = new ProductRepository()

// Export singleton getter function for consistency with other repositories
export const getProductRepository = () => productRepository
