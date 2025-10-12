import { prisma } from '@/lib/db';

export interface RecommendationScore {
  productId: string;
  score: number;
  reason: 'popular' | 'personalized' | 'trending' | 'similar';
}

export interface ProductRecommendations {
  personalized: RecommendationScore[];
  popular: RecommendationScore[];
  trending: RecommendationScore[];
}

export class RecommendationEngine {
  private static readonly WEIGHTS = {
    VIEW: 1,
    CART_ADD: 3,
    FAVORITE: 5,
    ORDER: 10,
  };

  private static readonly RECENCY_BOOST = 1.5;
  private static readonly TRENDING_DAYS = 7;

  /**
   * Calculate popularity score for a product
   */
  static calculatePopularityScore(product: {
    viewCount: number;
    cartCount: number;
    favoriteCount: number;
    orderCount: number;
    createdAt: Date;
  }): number {
    const baseScore = 
      (product.viewCount * this.WEIGHTS.VIEW) +
      (product.cartCount * this.WEIGHTS.CART_ADD) +
      (product.favoriteCount * this.WEIGHTS.FAVORITE) +
      (product.orderCount * this.WEIGHTS.ORDER);

    // Apply recency boost for new products (within 7 days)
    const now = new Date();
    const daysSinceCreation = (now.getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation <= this.TRENDING_DAYS) {
      return baseScore * this.RECENCY_BOOST;
    }

    return baseScore;
  }

  /**
   * Update popularity scores for all products
   */
  static async updateAllProductScores(): Promise<void> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        viewCount: true,
        cartCount: true,
        favoriteCount: true,
        orderCount: true,
        createdAt: true,
      },
    });

    const updates = products.map(product => {
      const score = this.calculatePopularityScore(product);
      return prisma.product.update({
        where: { id: product.id },
        data: {
          popularityScore: score,
          lastScoreUpdate: new Date(),
        },
      });
    });

    await Promise.all(updates);
  }

  /**
   * Get popular products based on popularity score
   */
  static async getPopularProducts(limit: number = 20): Promise<RecommendationScore[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { popularityScore: 'desc' },
      take: limit,
      select: { id: true, popularityScore: true },
    });

    return products.map(p => ({
      productId: p.id,
      score: p.popularityScore,
      reason: 'popular' as const,
    }));
  }

  /**
   * Get trending products based on recent activity
   */
  static async getTrendingProducts(limit: number = 20): Promise<RecommendationScore[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.TRENDING_DAYS);

    const trendingData = await prisma.userActivity.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: cutoffDate },
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

    // Get product details and calculate trending scores
    const productIds = trendingData.map(t => t.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: { id: true, popularityScore: true },
    });

    const productScoreMap = Object.fromEntries(
      products.map(p => [p.id, p.popularityScore])
    );

    return trendingData
      .filter(t => productScoreMap[t.productId] !== undefined)
      .map(t => ({
        productId: t.productId,
        score: t._count.id * this.RECENCY_BOOST,
        reason: 'trending' as const,
      }));
  }

  /**
   * Get personalized recommendations for a user
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    // Get user interests
    const userInterests = await prisma.userInterest.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { interestScore: 'desc' },
    });

    if (userInterests.length === 0) {
      // Fallback to popular products for new users
      return this.getPopularProducts(limit);
    }

    // Get products from interested categories, excluding already purchased
    const purchasedProductIds = await prisma.orderItem.findMany({
      where: {
        order: { userId },
      },
      select: { productId: true },
    }).then(items => items.map(item => item.productId));

    const categoryIds = userInterests.map(i => i.categoryId);
    
    const recommendations = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        id: { notIn: purchasedProductIds },
      },
      select: {
        id: true,
        categoryId: true,
        popularityScore: true,
      },
      take: limit * 2, // Get more to allow for scoring and filtering
    });

    // Calculate personalized scores
    const scoredRecommendations = recommendations.map(product => {
      const userInterest = userInterests.find(ui => ui.categoryId === product.categoryId);
      const interestMultiplier = userInterest ? (userInterest.interestScore / 100) : 1;
      
      return {
        productId: product.id,
        score: product.popularityScore * interestMultiplier,
        reason: 'personalized' as const,
      };
    });

    // Sort by score and limit
    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get similar products for a given product
   */
  static async getSimilarProducts(
    productId: string,
    limit: number = 12
  ): Promise<RecommendationScore[]> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, price: true },
    });

    if (!product) {
      return [];
    }

    // Find products in same category with similar price range (±30%)
    const minPrice = product.price * 0.7;
    const maxPrice = product.price * 1.3;

    const similarProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        isActive: true,
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
      },
      select: {
        id: true,
        popularityScore: true,
      },
      orderBy: { popularityScore: 'desc' },
      take: limit,
    });

    return similarProducts.map(p => ({
      productId: p.id,
      score: p.popularityScore,
      reason: 'similar' as const,
    }));
  }

  /**
   * Get all recommendations for a user
   */
  static async getAllRecommendations(
    userId?: string,
    limits = { personalized: 12, popular: 12, trending: 12 }
  ): Promise<ProductRecommendations> {
    const popular = await this.getPopularProducts(limits.popular);
    const trending = await this.getTrendingProducts(limits.trending);

    let personalized: RecommendationScore[];
    if (userId && userId !== 'guest') {
      personalized = await this.getPersonalizedRecommendations(userId, limits.personalized);
    } else {
      // For guest users, use popular products as a fallback for the personalized section
      personalized = popular.slice(0, limits.personalized).map(p => ({ ...p, reason: 'personalized' as const }));
    }

    return {
      personalized,
      popular,
      trending,
    };
  }
}

export default RecommendationEngine;