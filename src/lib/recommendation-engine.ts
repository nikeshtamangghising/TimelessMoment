import { db } from '@/lib/db';
import { products, userActivities, userInterests, categories, orderItems, orders } from '@/lib/db/schema';
import { and, asc, desc, eq, gt, gte, inArray, lt, lte, ne, notInArray, sql } from 'drizzle-orm';

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
   * Update popularity score for a single product
   */
  static async updateProductScore(productId: number): Promise<void> {
    const productResult = await db.select().from(products).where(eq(products.id, productId.toString())).limit(1);
    const product = productResult[0];

    if (!product) {
      return;
    }

    const score = this.calculatePopularityScore(product);
    await db.update(products).set({
      popularityScore: score.toString(),
      lastScoreUpdate: new Date(),
    }).where(eq(products.id, product.id));
  }

  /**
   * Update popularity scores for all products
   */
  static async updateAllProductScores(): Promise<void> {
    const productsResult = await db.select().from(products).where(eq(products.isActive, true));

    // Update each product individually since we can't do bulk updates with calculated scores
    for (const product of productsResult) {
      const score = this.calculatePopularityScore(product);
      await db.update(products).set({
        popularityScore: score.toString(),
        lastScoreUpdate: new Date(),
      }).where(eq(products.id, product.id));
    }
  }

  /**
   * Get popular products based on popularity score
   */
  static async getPopularProducts(limit: number = 20): Promise<RecommendationScore[]> {
    const productsResult = await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.popularityScore))
      .limit(limit);

    return productsResult.map(p => ({
      productId: p.id,
      score: parseFloat(p.popularityScore || '0'),
      reason: 'popular' as const,
    }));
  }

  /**
   * Get trending products based on recent activity
   */
  static async getTrendingProducts(limit: number = 20): Promise<RecommendationScore[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.TRENDING_DAYS);

      // Get trending data by grouping user activities
      const trendingData = await db.select({
        productId: userActivities.productId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(userActivities)
      .where(gte(userActivities.createdAt, cutoffDate))
      .groupBy(userActivities.productId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

      // Get product details and calculate trending scores
      const productIds = trendingData.map(t => t.productId).filter(id => id !== null);
      if (productIds.length === 0) {
        return [];
      }

      const productsResult = await db.select().from(products)
        .where(and(inArray(products.id, productIds), eq(products.isActive, true)));

      const productScoreMap = Object.fromEntries(
        productsResult.map(p => [p.id, parseFloat(p.popularityScore || '0')])
      );

      return trendingData
        .filter(t => t.productId && productScoreMap[t.productId] !== undefined)
        .map(t => ({
          productId: t.productId!,
          score: (t.count || 0) * this.RECENCY_BOOST,
          reason: 'trending' as const,
        }));
    } catch (error) {
      console.error('Error in getTrendingProducts:', error);
      return [];
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    // Get user interests
    const userInterestsResult = await db.select().from(userInterests)
      .where(eq(userInterests.userId, userId))
      .leftJoin(categories, eq(userInterests.categoryId, categories.id))
      .orderBy(desc(userInterests.interestScore));

    if (userInterestsResult.length === 0) {
      // Fallback to popular products for new users
      return this.getPopularProducts(limit);
    }

    // Get products from interested categories, excluding already purchased
    const orderItemsResult = await db.select().from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.userId, userId));

    const purchasedProductIds = orderItemsResult.map(item => item.order_items.productId);

    const categoryIds = userInterestsResult.map(i => i.user_interests.categoryId);
    
    const candidates = await db.select().from(products)
      .where(and(
        inArray(products.categoryId, categoryIds),
        eq(products.isActive, true),
        purchasedProductIds.length > 0 ? notInArray(products.id, purchasedProductIds) : undefined
      ))
      .limit(limit * 4); // Get more to allow for scoring and filtering

    // Calculate personalized scores using live counters + interest multiplier
    const scoredRecommendations = candidates.map(product => {
      const baseScore = this.calculatePopularityScore({
        viewCount: product.viewCount || 0,
        cartCount: product.cartCount || 0,
        favoriteCount: product.favoriteCount || 0,
        orderCount: product.orderCount || 0,
        createdAt: product.createdAt,
      })

      const userInterest = userInterestsResult.find(ui => ui.user_interests.categoryId === product.categoryId);
      const interestMultiplier = userInterest ? Math.max(1, (userInterest.user_interests.interestScore || 0) / 100) : 1;
      
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
    try {
      const productResult = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      const product = productResult[0];

      if (!product || !product.price) {
        return [];
      }

      // Find products in same category with similar price range (±30%)
      const productPrice = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price);
      if (isNaN(productPrice) || productPrice <= 0) {
        return [];
      }

      const minPrice = productPrice * 0.7;
      const maxPrice = productPrice * 1.3;

      // Use sql for decimal comparison to avoid type issues
      const similarProducts = await db.select().from(products)
        .where(and(
          eq(products.categoryId, product.categoryId),
          ne(products.id, productId),
          eq(products.isActive, true),
          sql`${products.price} >= ${minPrice}`,
          sql`${products.price} <= ${maxPrice}`
        ))
        .orderBy(desc(products.popularityScore))
        .limit(limit);

      return similarProducts.map(p => ({
        productId: p.id,
        score: parseFloat(p.popularityScore || '0'),
        reason: 'similar' as const,
      }));
    } catch (error) {
      console.error('Error in getSimilarProducts:', error);
      return [];
    }
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