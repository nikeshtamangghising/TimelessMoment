import { NextRequest, NextResponse } from 'next/server';
import RecommendationEngine from '@/lib/recommendation-engine';
import ActivityTracker from '@/lib/activity-tracker';
import { recalculateAllProductMetrics } from '@/lib/product-metrics';

// This endpoint should be called by a cron job service
// Vercel Cron, GitHub Actions, or external cron service
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify the request is from authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting product score update job...');
    const startTime = Date.now();

    // Recalculate raw metrics (favorites, carts, orders, purchases, views) before scores
    await recalculateAllProductMetrics();

    // Update all product popularity scores
    await RecommendationEngine.updateAllProductScores();

    const duration = Date.now() - startTime;
    console.log(`Product scores updated successfully in ${duration}ms`);

    // Optional: Clean up old activities (run weekly)
    const shouldCleanup = Math.random() < 0.02; // ~2% chance (roughly once per 50 runs)
    if (shouldCleanup) {
      console.log('Running activity cleanup...');
      await ActivityTracker.cleanOldActivities(90); // Keep 90 days
      console.log('Activity cleanup completed');
    }

    return NextResponse.json({
      success: true,
      message: 'Product scores updated successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      cleanupRun: shouldCleanup,
    });
  } catch (error) {
    console.error('Error updating product scores:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update product scores',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET method for manual triggering (development/testing)
export async function GET(request: NextRequest) {
  // Only allow in development or with proper authorization
  const isDevMode = process.env.NODE_ENV === 'development';
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!isDevMode && (!adminSecret || authHeader !== `Bearer ${adminSecret}`)) {
    return NextResponse.json(
      { error: 'Unauthorized - Use POST method for production' },
      { status: 401 }
    );
  }

  // Forward to POST handler
  return POST(request);
}