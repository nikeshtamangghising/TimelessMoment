import { prisma } from '@/lib/db';
import { ActivityType } from '@prisma/client';
import { getSessionId } from '@/lib/activity-utils';

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
        // Build the data object carefully to avoid Prisma validation issues
        const activityData: {
          productId: string;
          activityType: any;
          userId?: string;
          sessionId?: string;
        } = {
          productId,
          activityType,
        };
        
        // Add userId or sessionId based on what's available
        if (userId) {
          activityData.userId = userId;
        }
        if (sessionId && !userId) {
          activityData.sessionId = sessionId;
        }
        
        await tx.userActivity.create({
          data: activityData,
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
          const activityData: {
            productId: string;
            activityType: any;
            userId?: string;
            sessionId?: string;
          } = {
            productId: activity.productId,
            activityType: activity.activityType,
          };
          
          // Add userId or sessionId based on what's available
          if (activity.userId) {
            activityData.userId = activity.userId;
          }
          if (activity.sessionId && !activity.userId) {
            activityData.sessionId = activity.sessionId;
          }
          
          await tx.userActivity.create({
            data: activityData,
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
    // Only VIEW directly increments product counters here to avoid double-counting.
    // Other counters (CART_ADD, FAVORITE, ORDER) are updated in their respective repositories/services.
    const fieldMap: Partial<Record<ActivityType, string>> = {
      VIEW: 'viewCount',
    };

    return (fieldMap as Record<ActivityType, string>)[activityType] || null;
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

// Helper function for tracking individual activities (client-safe)
export const trackActivity = async (data: ActivityData) => {
  // Check if we're running on the client side
  if (typeof window !== 'undefined') {
    // Ensure we have at least a sessionId for guests
    const payload: ActivityData = {
      ...data,
      sessionId: data.userId ? data.sessionId : (data.sessionId || getSessionId()),
    }

    try {
      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.warn(`trackActivity: non-OK response ${response.status} ${response.statusText} ${text}`)
        return { success: false }
      }
      
      return await response.json()
    } catch (error) {
      // Do not throw from client-side tracking; avoid breaking UX
      console.warn('trackActivity: request failed:', error)
      return { success: false }
    }
  } else {
    // Server side - use direct method
    return ActivityTracker.trackActivity(data)
  }
}

// Helper function to create a view tracker observer
export const createViewTracker = (userId?: string, sessionId?: string) => {
  // Check if Intersection Observer is available
  if (typeof IntersectionObserver === 'undefined') {
    return null
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const productId = entry.target.getAttribute('data-product-id')
          if (productId && (userId || sessionId)) {
            // Track the view activity
            trackActivity({
              userId,
              sessionId: !userId ? sessionId : undefined,
              productId,
              activityType: 'VIEW',
            }).catch((error) => {
              console.error('Error tracking view:', error)
            })
            
            // Stop observing this element to prevent duplicate views
            observer.unobserve(entry.target)
          }
        }
      })
    },
    {
      threshold: 0.5, // Trigger when 50% of the element is visible
      rootMargin: '0px 0px -50px 0px', // Require element to be 50px into viewport
    }
  )

  return observer
}

// Helper function to track view immediately (without observer)
export const trackView = (productId: string, userId?: string, sessionId?: string) => {
  return trackActivity({
    userId,
    sessionId: !userId ? sessionId : undefined,
    productId,
    activityType: 'VIEW',
  })
}

export default ActivityTracker;
