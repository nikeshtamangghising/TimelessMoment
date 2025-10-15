import { NextRequest, NextResponse } from 'next/server';
import ActivityTracker from '@/lib/activity-tracker';
import { generateSitemap } from '@/lib/sitemap';
import { prisma } from '@/lib/db';
import { forceFullUpdate } from '@/lib/smart-score-updater';

/**
 * Consolidated daily maintenance job for Vercel Hobby plan
 * Runs once per day at 2 AM UTC
 * Combines: product scores, sitemap, session cleanup, email analytics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily maintenance job...');
    const startTime = Date.now();
    const results: Record<string, any> = {};

    // Task 1: Update product scores and metrics (using smart updater)
    try {
      console.log('1/4 Updating product scores...');
      await forceFullUpdate();
      
      // Weekly cleanup (run on Sundays)
      const shouldCleanup = new Date().getDay() === 0; // Run on Sundays
      if (shouldCleanup) {
        await ActivityTracker.cleanOldActivities(90);
        results.activityCleanup = 'completed';
      }
      
      results.productScores = 'success';
      console.log('✅ Product scores updated via smart updater');
    } catch (error) {
      console.error('❌ Product scores failed:', error);
      results.productScores = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Task 2: Update sitemap
    try {
      console.log('2/4 Updating sitemap...');
      await generateSitemap();
      results.sitemap = 'success';
      console.log('✅ Sitemap updated');
    } catch (error) {
      console.error('❌ Sitemap update failed:', error);
      results.sitemap = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Task 3: Cleanup sessions and tokens
    try {
      console.log('3/4 Cleaning up sessions...');
      
      // Clean expired sessions (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deletedSessions = await prisma.session.deleteMany({
        where: { expires: { lt: thirtyDaysAgo } }
      });

      // Clean expired verification tokens (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const deletedTokens = await prisma.verificationToken.deleteMany({
        where: { expires: { lt: sevenDaysAgo } }
      });

      results.cleanup = {
        status: 'success',
        sessionsDeleted: deletedSessions.count,
        tokensDeleted: deletedTokens.count
      };
      console.log(`✅ Cleanup: ${deletedSessions.count} sessions, ${deletedTokens.count} tokens`);
    } catch (error) {
      console.error('❌ Session cleanup failed:', error);
      results.cleanup = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Task 4: Email analytics (placeholder for future implementation)
    try {
      console.log('4/4 Processing email analytics...');
      // Placeholder - actual implementation would process email metrics
      results.emailAnalytics = 'success (placeholder)';
      console.log('✅ Email analytics processed');
    } catch (error) {
      console.error('❌ Email analytics failed:', error);
      results.emailAnalytics = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    const duration = Date.now() - startTime;
    console.log(`Daily maintenance completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Daily maintenance completed',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Fatal error in daily maintenance:', error);
    return NextResponse.json(
      { 
        error: 'Daily maintenance failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}