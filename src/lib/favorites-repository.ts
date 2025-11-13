import { db } from '@/lib/db';
import { userFavorites, products, categories, cartItems } from '@/lib/db/schema';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { ActivityTracker } from './activity-tracker';

export interface FavoriteItem {
  id: string;
  productId: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice?: number;
    images: string[];
    inventory: number;
    isActive: boolean;
    category: {
      name: string;
    };
  };
}

export class FavoritesRepository {
  /**
   * Add product to favorites
   */
  static async addToFavorites(userId: string, productId: string): Promise<FavoriteItem> {
    // Check if product exists
    const productResult = await db.select({
      id: products.id,
      isActive: products.isActive,
      name: products.name,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
    
    const product = productResult[0];

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    // Check if already in favorites
    const existingResult = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.productId, productId)
      ))
      .limit(1);
    
    const existing = existingResult[0];

    if (existing) {
      throw new Error('Product is already in favorites');
    }

    try {
      // Create favorite
      const insertResult = await db.insert(userFavorites)
        .values({
          userId,
          productId,
        })
        .returning();

      // Increment product favoriteCount
      await db.update(products)
        .set({ favoriteCount: sql`${products.favoriteCount} + 1` })
        .where(eq(products.id, productId));

      // Fetch with product and category
      const favorite = await db.query.userFavorites.findFirst({
        where: eq(userFavorites.id, insertResult[0].id),
        with: {
          product: {
            with: { category: true },
          },
        },
      });

      // Track activity (for personalization/trending); counters updated above
      await ActivityTracker.trackActivity({
        userId,
        productId,
        activityType: 'FAVORITE',
      });

      return favorite as FavoriteItem;
    } catch (error) {
      throw new Error('Failed to add to favorites');
    }
  }

  /**
   * Remove product from favorites
   */
  static async removeFromFavorites(userId: string, productId: string): Promise<void> {
    const favoriteResult = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.productId, productId)
      ))
      .limit(1);

    const favorite = favoriteResult[0];
    
    if (!favorite) {
      throw new Error('Product not found in favorites');
    }

    await db.delete(userFavorites)
      .where(eq(userFavorites.id, favorite.id));
    
    // Decrement product favoriteCount
    await db.update(products)
      .set({ favoriteCount: sql`GREATEST(${products.favoriteCount} - 1, 0)` })
      .where(eq(products.id, productId));
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(userId: string, productId: string): Promise<{ added: boolean; favorite?: FavoriteItem }> {
    const existingResult = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.productId, productId)
      ))
      .limit(1);
    
    const existing = existingResult[0];

    if (existing) {
      await this.removeFromFavorites(userId, productId);
      return { added: false };
    } else {
      const favorite = await this.addToFavorites(userId, productId);
      return { added: true, favorite };
    }
  }

  /**
   * Get user's favorites
   */
  static async getFavorites(userId: string): Promise<FavoriteItem[]> {
    const favorites = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      with: {
        product: {
          with: { category: true },
        },
      },
      orderBy: desc(userFavorites.createdAt),
    });

    // Filter out inactive products
    return favorites.filter(favorite => 
      favorite.product.isActive
    ) as FavoriteItem[];
  }

  /**
   * Check if product is in user's favorites
   */
  static async isInFavorites(userId: string, productId: string): Promise<boolean> {
    const favoriteResult = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.productId, productId)
      ))
      .limit(1);

    return favoriteResult.length > 0;
  }

  /**
   * Get favorites count for user
   */
  static async getFavoritesCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(userFavorites)
      .innerJoin(products, eq(userFavorites.productId, products.id))
      .where(and(
        eq(userFavorites.userId, userId),
        eq(products.isActive, true)
      ));

    return Number(result[0]?.count || 0);
  }

  /**
   * Get recently added favorites
   */
  static async getRecentFavorites(userId: string, limit: number = 5): Promise<FavoriteItem[]> {
    const favorites = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      with: {
        product: {
          with: { category: true },
        },
      },
      orderBy: desc(userFavorites.createdAt),
      limit,
    });

    return favorites.filter(favorite => 
      favorite.product.isActive
    ) as FavoriteItem[];
  }

  /**
   * Get favorites by category
   */
  static async getFavoritesByCategory(userId: string, categoryId: string): Promise<FavoriteItem[]> {
    const favorites = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      with: {
        product: {
          with: { category: true },
        },
      },
      orderBy: desc(userFavorites.createdAt),
    });

    // Filter by category and active status
    return favorites.filter(fav => 
      fav.product.categoryId === categoryId && fav.product.isActive
    ) as FavoriteItem[];
  }

  /**
   * Get most favorited products (for analytics/recommendations)
   */
  static async getMostFavorited(limit: number = 20) {
    const mostFavorited = await db.select({
      productId: userFavorites.productId,
      count: sql<number>`count(*)`,
    })
    .from(userFavorites)
    .innerJoin(products, eq(userFavorites.productId, products.id))
    .where(eq(products.isActive, true))
    .groupBy(userFavorites.productId)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);

    // Get product details
    const productIds = mostFavorited.map(f => f.productId);
    if (productIds.length === 0) return [];
    
    const productsResult = await db.query.products.findMany({
      where: inArray(products.id, productIds),
      with: { category: true },
    });

    const productMap = Object.fromEntries(
      productsResult.map(p => [p.id, p])
    );

    return mostFavorited.map(favorite => ({
      product: productMap[favorite.productId],
      favoriteCount: Number(favorite.count),
    })).filter(item => item.product);
  }

  /**
   * Clean up favorites for deleted products
   */
  static async cleanupInvalidFavorites(): Promise<void> {
    // Get inactive product IDs
    const inactiveProducts = await db.select({ id: products.id })
      .from(products)
      .where(eq(products.isActive, false));
    
    const inactiveProductIds = inactiveProducts.map(p => p.id);
    
    if (inactiveProductIds.length > 0) {
      await db.delete(userFavorites)
        .where(inArray(userFavorites.productId, inactiveProductIds));
    }
  }

  /**
   * Get favorites summary for user
   */
  static async getFavoritesSummary(userId: string) {
    const [totalCount, recentFavorites] = await Promise.all([
      this.getFavoritesCount(userId),
      this.getRecentFavorites(userId, 3),
    ]);

    // Get category breakdown
    const favorites = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      with: {
        product: {
          with: { category: true },
        },
      },
    });

    const activeFavorites = favorites.filter(f => f.product.isActive);
    const breakdown: Record<string, number> = {};
    activeFavorites.forEach(favorite => {
      const categoryName = favorite.product.category?.name || 'Unknown';
      breakdown[categoryName] = (breakdown[categoryName] || 0) + 1;
    });

    return {
      totalCount,
      recentFavorites,
      categoryBreakdown: breakdown,
    };
  }

  /**
   * Get products that are both in favorites and cart (for quick checkout)
   */
  static async getFavoritesInCart(userId: string): Promise<{
    productId: string;
    product: any;
    cartQuantity: number;
    favoritedAt: Date;
  }[]> {
    const favorites = await db.query.userFavorites.findMany({
      where: eq(userFavorites.userId, userId),
      with: { product: true },
    });

    const favoriteProductIds = favorites.map(f => f.productId);
    
    if (favoriteProductIds.length === 0) return [];
    
    const cartItemsResult = await db.select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, userId),
        inArray(cartItems.productId, favoriteProductIds)
      ));

    const cartMap = Object.fromEntries(
      cartItemsResult.map(item => [item.productId, item])
    );

    return favorites
      .filter(favorite => cartMap[favorite.productId])
      .map(favorite => ({
        productId: favorite.productId,
        product: favorite.product,
        cartQuantity: cartMap[favorite.productId].quantity,
        favoritedAt: favorite.createdAt,
      }));
  }

  /**
   * Get favorite products with availability status
   */
  static async getFavoritesWithAvailability(userId: string): Promise<(FavoriteItem & {
    availability: 'available' | 'low_stock' | 'out_of_stock';
    stockCount: number;
  })[]> {
    const favorites = await this.getFavorites(userId);

    return favorites.map(favorite => ({
      ...favorite,
      stockCount: favorite.product.inventory,
      availability: favorite.product.inventory === 0 
        ? 'out_of_stock' as const
        : favorite.product.inventory <= 5 
          ? 'low_stock' as const 
          : 'available' as const,
    }));
  }
}

export default FavoritesRepository;