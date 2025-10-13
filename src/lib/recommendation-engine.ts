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
  // Allow weights to be configured via environment variables
  private static getWeights() {
    const parse = (envName: string, fallback: number) => {
      const v = parseFloat(process.env[envName] || '')
      return Number.isFinite(v) ? v : fallback
    }
    return {
      VIEW: parse('RECO_WEIGHT_VIEW', 1),
      CART_ADD: parse('RECO_WEIGHT_CART', 3),
      FAVORITE: parse('RECO_WEIGHT_FAVORITE', 5),
      ORDER: parse('RECO_WEIGHT_ORDER', 10),
    }
  }

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
    const W = this.getWeights()
    const baseScore = 
      (product.viewCount * W.VIEW) +
      (product.cartCount * W.CART_ADD) +
      (product.favoriteCount * W.FAVORITE) +
      (product.orderCount * W.ORDER);

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
    
    const candidates = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        id: { notIn: purchasedProductIds },
      },
      select: {
        id: true,
        categoryId: true,
        viewCount: true,
        cartCount: true,
        favoriteCount: true,
        orderCount: true,
        createdAt: true,
      },
      take: limit * 4, // Get more to allow for scoring and filtering
    });

    // Calculate personalized scores using live counters + interest multiplier
    const scoredRecommendations = candidates.map(product => {
      const baseScore = this.calculatePopularityScore({
        viewCount: product.viewCount || 0,
        cartCount: product.cartCount || 0,
        favoriteCount: product.favoriteCount || 0,
        orderCount: product.orderCount || 0,
        createdAt: product.createdAt,
      })

      const userInterest = userInterests.find(ui => ui.categoryId === product.categoryId);
      const interestMultiplier = userInterest ? Math.max(1, userInterest.interestScore / 100) : 1;
      
      return {
        productId: product.id,
        score: baseScore * interestMultiplier,
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