import { db } from '@/lib/db';
import { 
  userActivities, 
  products, 
  userInterests, 
  categories 
} from '@/lib/db/schema';
import { 
  eq, 
  and, 
  gte, 
  lt, 
  count, 
  sum, 
  desc,
  sql
} from 'drizzle-orm';
import { getSessionId } from '@/lib/activity-utils';
import { queueProductUpdate } from '@/lib/smart-score-updater';

// Define activity types as constants since we're not using Prisma enums
export const ActivityType = {
  VIEW: 'VIEW',
  CART_ADD: 'CART_ADD',
  FAVORITE: 'FAVORITE',
  ORDER: 'ORDER',
} as const;

export type ActivityType = typeof ActivityType[keyof typeof ActivityType];

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
      // 1. Create activity record
      const activityData: typeof userActivities.$inferInsert = {
        productId,
        activityType,
      } as any;
      
      // Add userId or sessionId based on what's available
      if (userId) {
        activityData.userId = userId;
      }
      if (sessionId && !userId) {
        activityData.sessionId = sessionId;
      }
      
      await db.insert(userActivities).values(activityData);

      // 2. Update product counters
      const updateField = this.getProductCounterField(activityType);
      if (updateField) {
        await db.update(products)
          .set({ 
            [updateField]: sql`${products[updateField]} + 1`
          } as any)
          .where(eq(products.id, productId));
      }

      // 3. Update user interests (only for logged-in users)
      if (userId) {
        await this.updateUserInterests(userId, productId, activityType);
      }
      
      // 4. Queue product for smart score update
      queueProductUpdate(parseInt(productId));
    } catch (error) {
      throw new Error('Failed to track activity');
    }
  }

  /**
   * Track multiple activities in a batch
   */
  static async trackActivities(activities: ActivityData[]): Promise<void> {
    try {
      // Process each activity
      for (const activity of activities) {
        const activityData: typeof userActivities.$inferInsert = {
          productId: activity.productId,
          activityType: activity.activityType,
        } as any;
        
        // Add userId or sessionId based on what's available
        if (activity.userId) {
          activityData.userId = activity.userId;
        }
        if (activity.sessionId && !activity.userId) {
          activityData.sessionId = activity.sessionId;
        }
        
        await db.insert(userActivities).values(activityData);

        // Update product counters
        const updateField = this.getProductCounterField(activity.activityType);
        if (updateField) {
          await db.update(products)
            .set({ 
              [updateField]: sql`${products[updateField]} + 1`
            } as any)
            .where(eq(products.id, activity.productId));
        }

        // Update user interests for logged-in users
        if (activity.userId) {
          await this.updateUserInterests(
            activity.userId,
            activity.productId,
            activity.activityType
          );
        }
      }
    } catch (error) {
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
    const whereCondition = 'userId' in identifier 
      ? eq(userActivities.userId, identifier.userId)
      : eq(userActivities.sessionId, identifier.sessionId);

    return await db.query.userActivities.findMany({
      where: whereCondition,
      orderBy: desc(userActivities.createdAt),
      limit,
      with: {
        product: {
          columns: {
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

    const whereConditions = [gte(userActivities.createdAt, cutoffDate)];
    
    if (productId) {
      whereConditions.push(eq(userActivities.productId, productId));
    }

    const result = await db.select({
      activityType: userActivities.activityType,
      count: count()
    })
    .from(userActivities)
    .where(and(...whereConditions))
    .groupBy(userActivities.activityType);

    return result.map(item => ({
      activityType: item.activityType,
      _count: {
        id: item.count
      }
    }));
  }

  /**
   * Update user interest profile based on activity
   */
  private static async updateUserInterests(
    userId: string,
    productId: string,
    activityType: ActivityType
  ): Promise<void> {
    // Get product category
    const productResult = await db.select({ 
      categoryId: products.categoryId 
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

    if (!productResult.length) return;

    const product = productResult[0];
    const interestScore = this.INTEREST_WEIGHTS[activityType];

    // Check if user interest exists
    const existingInterest = await db.select()
      .from(userInterests)
      .where(and(
        eq(userInterests.userId, userId),
        eq(userInterests.categoryId, product.categoryId)
      ))
      .limit(1);

    if (existingInterest.length > 0) {
      // Update existing interest
      await db.update(userInterests)
        .set({
          interestScore: sql`${userInterests.interestScore} + ${interestScore}`,
          interactionCount: sql`${userInterests.interactionCount} + 1`,
          lastInteraction: new Date(),
        })
        .where(and(
          eq(userInterests.userId, userId),
          eq(userInterests.categoryId, product.categoryId)
        ));
    } else {
      // Create new interest
      await db.insert(userInterests).values({
        userId,
        categoryId: product.categoryId,
        interestScore: interestScore.toString(),
        interactionCount: 1,
        lastInteraction: new Date(),
      });
    }
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

    await db.delete(userActivities)
      .where(lt(userActivities.createdAt, cutoffDate));
  }

  /**
   * Get user's product interaction history
   */
  static async getUserProductHistory(
    userId: string,
    productId: string
  ) {
    return await db.query.userActivities.findMany({
      where: and(
        eq(userActivities.userId, userId),
        eq(userActivities.productId, productId)
      ),
      orderBy: desc(userActivities.createdAt),
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

    const recentView = await db.query.userActivities.findFirst({
      where: and(
        eq(userActivities.userId, userId),
        eq(userActivities.productId, productId),
        eq(userActivities.activityType, 'VIEW'),
        gte(userActivities.createdAt, cutoffDate)
      ),
    });

    return !!recentView;
  }

  /**
   * Get trending categories based on recent activity
   */
  static async getTrendingCategories(days: number = 7, limit: number = 10) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const trendingData = await db.query.userActivities.findMany({
      where: gte(userActivities.createdAt, cutoffDate),
      with: {
        product: {
          columns: { categoryId: true },
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
    if (sorted.length === 0) return [];

    const categoryIds = sorted.map(([categoryId]) => categoryId);
    const categoriesResult = await db.query.categories.findMany({
      where: sql`id IN (${categoryIds.map(() => '?').join(',')})`,
      columns: { id: true, name: true, slug: true },
    });

    const categoryMap = Object.fromEntries(
      categoriesResult.map(cat => [cat.id, cat])
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
        return { success: false }
      }
      
      return await response.json()
    } catch (error) {
      // Do not throw from client-side tracking; avoid breaking UX
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