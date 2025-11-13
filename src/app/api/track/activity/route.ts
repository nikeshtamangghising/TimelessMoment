import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import ActivityTracker from '@/lib/activity-tracker';
import { ActivityType } from '@/lib/db/schema';

// Validation schema
const trackActivitySchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  productId: z.string().cuid(),
  activityType: z.enum(['VIEW', 'CART_ADD', 'FAVORITE', 'ORDER']),
}).refine(data => data.userId || data.sessionId, {
  message: "Either userId or sessionId must be provided",
});

const trackBatchSchema = z.object({
  activities: z.array(trackActivitySchema).min(1).max(50), // Limit batch size
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if it's a batch request
    if (body.activities && Array.isArray(body.activities)) {
      // Batch tracking
      const validatedData = trackBatchSchema.parse(body);
      
      await ActivityTracker.trackActivities(validatedData.activities.map(activity => ({
        userId: activity.userId,
        sessionId: activity.sessionId,
        productId: activity.productId,
        activityType: activity.activityType as ActivityType,
      })));

      return NextResponse.json({ 
        success: true, 
        message: `Tracked ${validatedData.activities.length} activities`,
        count: validatedData.activities.length,
      });
    } else {
      // Single activity tracking
      const validatedData = trackActivitySchema.parse(body);
      
      await ActivityTracker.trackActivity({
        userId: validatedData.userId,
        sessionId: validatedData.sessionId,
        productId: validatedData.productId,
        activityType: validatedData.activityType as ActivityType,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Activity tracked successfully',
      });
    }
  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track activity' },
      { status: 500 }
    );
  }
}

// Get activity summary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') as 'day' | 'week' | 'month' || 'day';
    const productId = searchParams.get('productId') || undefined;

    const summary = await ActivityTracker.getActivitySummary(timeframe, productId);

    return NextResponse.json({
      timeframe,
      productId,
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activity summary' },
      { status: 500 }
    );
  }
}