import { prisma } from '@/lib/db';
import { ActivityType } from '@prisma/client';

export interface ActivityData {
  userId?: string;
  sessionId?: string;
  productId: string;
  activityType: ActivityType;
}

export class ActivityTracker {
  private static readonly INTEREST_WEIGHTS = {
    VIEW: 1,
    CART_ADD: 3,
    FAVORITE: 5,
    ORDER: 10,
  };

  /**
   * Track user activity and update product counters
   */
  static async trackActivity(data: ActivityData): Promise<void> {
    const { userId, sessionId, productId, activityType } = data;

    // Validate that either userId or sessionId is provided
    if (!userId && !sessionId) {
      throw new Error('Either userId or sessionId must be provided');
    }

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Create activity record
        await tx.userActivity.create({
          data: {
            userId,
            sessionId,
            productId,
            activityType,
          },
        });

        // 2. Update product counters
        const updateField = this.getProductCounterField(activityType);
        if (updateField) {
          await tx.product.update({
            where: { id: productId },
            data: {
              [updateField]: { increment: 1 },
            },
          });
        }

        // 3. Update user interests (only for logged-in users)
        if (userId) {
          await this.updateUserInterests(tx, userId, productId, activityType);
        }
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
      throw new Error('Failed to track activity');
    }
  }

  /**
   * Track multiple activities in a batch
   */
  static async trackActivities(activities: ActivityData[]): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        for (const activity of activities) {
          await tx.userActivity.create({
            data: {
              userId: activity.userId,
              sessionId: activity.sessionId,
              productId: activity.productId,
              activityType: activity.activityType,
            },
          });

          // Update product counters
          const updateField = this.getProductCounterField(activity.activityType);
          if (updateField) {
            await tx.product.update({
              where: { id: activity.productId },
              data: {
                [updateField]: { increment: 1 },
              },
            });
          }

          // Update user interests for logged-in users
          if (activity.userId) {
            await this.updateUserInterests(
              tx,
              activity.userId,
              activity.productId,
              activity.activityType
            );
          }
        }
      });
    } catch (error) {
      console.error('Error tracking batch activities:', error);
      throw new Error('Failed to track activities');
    }
  }

  /**
   * Get recent activities for a user or session
   */
  static async getRecentActivities(
    identifier: { userId: string } | { sessionId: string },
    limit: number = 50
  ) {
    return await prisma.userActivity.findMany({
      where: identifier,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
          },
        },
      },
    });
  }

  /**
   * Get activity summary for analytics
   */
  static async getActivitySummary(
    timeframe: 'day' | 'week' | 'month' = 'day',
    productId?: string
  ) {
    const timeMap = {
      day: 1,
      week: 7,
      month: 30,
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeMap[timeframe]);

    const whereClause: any = {
      createdAt: { gte: cutoffDate },
    };

    if (productId) {
      whereClause.productId = productId;
    }

    return await prisma.userActivity.groupBy({
      by: ['activityType'],
      where: whereClause,
      _count: {
        id: true,
      },
    });
  }

  /**
   * Update user interest profile based on activity
   */
  private static async updateUserInterests(
    tx: any,
    userId: string,
    productId: string,
    activityType: ActivityType
  ): Promise<void> {
    // Get product category
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });

    if (!product) return;

    const interestScore = this.INTEREST_WEIGHTS[activityType];

    // Upsert user interest
    await tx.userInterest.upsert({
      where: {
        userId_categoryId: {
          userId,
          categoryId: product.categoryId,
        },
      },
      update: {
        interestScore: { increment: interestScore },
        interactionCount: { increment: 1 },
        lastInteraction: new Date(),
      },
      create: {
        userId,
        categoryId: product.categoryId,
        interestScore,
        interactionCount: 1,
        lastInteraction: new Date(),
      },
    });
  }

  /**
   * Get the product counter field name for an activity type
   */
  private static getProductCounterField(activityType: ActivityType): string | null {
    const fieldMap: Record<ActivityType, string> = {
      VIEW: 'viewCount',
      CART_ADD: 'cartCount',
      FAVORITE: 'favoriteCount',
      ORDER: 'orderCount',
    };

    return fieldMap[activityType] || null;
  }

  /**
   * Clean old activities (for privacy and performance)
   */
  static async cleanOldActivities(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await prisma.userActivity.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
  }

  /**
   * Get user's product interaction history
   */
  static async getUserProductHistory(
    userId: string,
    productId: string
  ) {
    return await prisma.userActivity.findMany({
      where: {
        userId,
        productId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Check if user has viewed a product recently
   */
  static async hasRecentView(
    userId: string,
    productId: string,
    hours: number = 1
  ): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const recentView = await prisma.userActivity.findFirst({
      where: {
        userId,
        productId,
        activityType: 'VIEW',
        createdAt: { gte: cutoffDate },
      },
    });

    return !!recentView;
  }

  /**
   * Get trending categories based on recent activity
   */
  static async getTrendingCategories(days: number = 7, limit: number = 10) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const trendingData = await prisma.userActivity.findMany({
      where: {
        createdAt: { gte: cutoffDate },
      },
      include: {
        product: {
          select: { categoryId: true },
        },
      },
    });

    // Count activities by category
    const categoryCount: Record<string, number> = {};
    trendingData.forEach(activity => {
      const categoryId = activity.product.categoryId;
      categoryCount[categoryId] = (categoryCount[categoryId] || 0) + 1;
    });

    // Sort and limit
    const sorted = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    // Get category details
    const categoryIds = sorted.map(([categoryId]) => categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, slug: true },
    });

    const categoryMap = Object.fromEntries(
      categories.map(cat => [cat.id, cat])
    );

    return sorted.map(([categoryId, count]) => ({
      category: categoryMap[categoryId],
      activityCount: count,
    }));
  }
}

export default ActivityTracker;