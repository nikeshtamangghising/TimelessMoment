import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  processPendingUpdates, 
  forceFullUpdate, 
  getUpdateStatus,
  triggerManualUpdate 
} from '@/lib/smart-score-updater';

/**
 * Admin API for manual product score management
 * Replaces the old hourly cron job with on-demand control
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, productIds } = body;

    switch (action) {
      case 'process-pending':
        await processPendingUpdates();
        return NextResponse.json({
          success: true,
          message: 'Pending updates processed',
          timestamp: new Date().toISOString()
        });

      case 'force-full':
        await forceFullUpdate();
        return NextResponse.json({
          success: true,
          message: 'Full update completed',
          timestamp: new Date().toISOString()
        });

      case 'manual-update':
        if (!Array.isArray(productIds) || productIds.length === 0) {
          return NextResponse.json(
            { error: 'productIds array is required for manual update' },
            { status: 400 }
          );
        }
        await triggerManualUpdate(productIds);
        return NextResponse.json({
          success: true,
          message: `Manual update triggered for ${productIds.length} products`,
          productIds,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: process-pending, force-full, or manual-update' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in manual score update:', error);
    return NextResponse.json(
      { 
        error: 'Update failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get current update status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const status = getUpdateStatus();
    
    return NextResponse.json({
      success: true,
      status: {
        ...status,
        timeSinceLastUpdateFormatted: `${Math.round(status.timeSinceLastUpdate / (1000 * 60))} minutes ago`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting update status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}