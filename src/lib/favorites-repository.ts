import { prisma } from '@/lib/db';
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, name: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    // Check if already in favorites
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new Error('Product is already in favorites');
    }

    try {
      const favorite = await prisma.$transaction(async (tx) => {
        const fav = await tx.favorite.create({
          data: {
            userId,
            productId,
          },
          include: {
            product: {
              include: { category: true },
            },
          },
        })

        // Increment product favoriteCount
        await tx.product.update({
          where: { id: productId },
          data: { favoriteCount: { increment: 1 } },
        })

        return fav
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
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new Error('Product not found in favorites');
    }

    await prisma.$transaction(async (tx) => {
      await tx.favorite.delete({ where: { id: favorite.id } })
      // Decrement product favoriteCount
      await tx.product.update({
        where: { id: productId },
        data: { favoriteCount: { decrement: 1 } },
      })
    })
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(userId: string, productId: string): Promise<{ added: boolean; favorite?: FavoriteItem }> {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

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
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!favorite;
  }

  /**
   * Get favorites count for user
   */
  static async getFavoritesCount(userId: string): Promise<number> {
    return await prisma.favorite.count({
      where: { 
        userId,
        product: { isActive: true },
      },
    });
  }

  /**
   * Get recently added favorites
   */
  static async getRecentFavorites(userId: string, limit: number = 5): Promise<FavoriteItem[]> {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return favorites.filter(favorite => 
      favorite.product.isActive
    ) as FavoriteItem[];
  }

  /**
   * Get favorites by category
   */
  static async getFavoritesByCategory(userId: string, categoryId: string): Promise<FavoriteItem[]> {
    const favorites = await prisma.favorite.findMany({
      where: { 
        userId,
        product: { 
          categoryId,
          isActive: true,
        },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites as FavoriteItem[];
  }

  /**
   * Get most favorited products (for analytics/recommendations)
   */
  static async getMostFavorited(limit: number = 20) {
    const mostFavorited = await prisma.favorite.groupBy({
      by: ['productId'],
      where: {
        product: { isActive: true },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = mostFavorited.map(f => f.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

    const productMap = Object.fromEntries(
      products.map(p => [p.id, p])
    );

    return mostFavorited.map(favorite => ({
      product: productMap[favorite.productId],
      favoriteCount: favorite._count.id,
    })).filter(item => item.product);
  }

  /**
   * Clean up favorites for deleted products
   */
  static async cleanupInvalidFavorites(): Promise<void> {
    await prisma.favorite.deleteMany({
      where: {
        product: { isActive: false },
      },
    });
  }

  /**
   * Get favorites summary for user
   */
  static async getFavoritesSummary(userId: string) {
    const [totalCount, recentFavorites, categoryBreakdown] = await Promise.all([
      this.getFavoritesCount(userId),
      this.getRecentFavorites(userId, 3),
      prisma.favorite.findMany({
        where: { 
          userId,
          product: { isActive: true },
        },
        include: {
          product: {
            select: { categoryId: true, category: { select: { name: true } } }
          }
        }
      }).then((favorites) => {
        const breakdown: Record<string, number> = {};
        favorites.forEach(favorite => {
          const categoryName = (favorite.product as any).category?.name || 'Unknown';
          breakdown[categoryName] = (breakdown[categoryName] || 0) + 1;
        });
        return breakdown;
      }),
    ]);

    return {
      totalCount,
      recentFavorites,
      categoryBreakdown,
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
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { product: true },
    });

    const favoriteProductIds = favorites.map(f => f.productId);
    
    const cartItems = await prisma.cart.findMany({
      where: {
        userId,
        productId: { in: favoriteProductIds },
      },
    });

    const cartMap = Object.fromEntries(
      cartItems.map(item => [item.productId, item])
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