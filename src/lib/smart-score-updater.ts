/**
 * Smart Score Updater - Event-driven product score updates
 * Replaces hourly cron jobs with intelligent, on-demand updates
 * Optimized for Vercel Hobby plan limitations
 */

import RecommendationEngine from '@/lib/recommendation-engine';
import { recalculateAllProductMetrics } from '@/lib/product-metrics';

// In-memory cache for update tracking
interface UpdateTracker {
  lastFullUpdate: Date;
  pendingProducts: Set<number>;
  updateInProgress: boolean;
}

const updateTracker: UpdateTracker = {
  lastFullUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago initially
  pendingProducts: new Set(),
  updateInProgress: false
};

// Configuration
const CONFIG = {
  BATCH_SIZE: 10, // Products to update per batch
  MIN_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes between batches
  FULL_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours for full update
  MAX_PENDING: 100, // Max products in pending queue
};

/**
 * Queue a product for score update after user activity
 */
export function queueProductUpdate(productId: number): void {
  if (updateTracker.pendingProducts.size < CONFIG.MAX_PENDING) {
    updateTracker.pendingProducts.add(productId);
  }
  
  // Trigger batch update if queue is getting full
  if (updateTracker.pendingProducts.size >= CONFIG.BATCH_SIZE) {
    void processPendingUpdatesDebounced();
  }
}

/**
 * Process pending product updates in batches
 */
export async function processPendingUpdates(): Promise<void> {
  if (updateTracker.updateInProgress || updateTracker.pendingProducts.size === 0) {
    return;
  }

  // Check if enough time has passed since last update
  const timeSinceLastUpdate = Date.now() - updateTracker.lastFullUpdate.getTime();
  if (timeSinceLastUpdate < CONFIG.MIN_UPDATE_INTERVAL) {
    return;
  }

  updateTracker.updateInProgress = true;

  try {
    // Get batch of products to update
    const productsToUpdate = Array.from(updateTracker.pendingProducts)
      .slice(0, CONFIG.BATCH_SIZE);
    

    // Update metrics for specific products
    for (const productId of productsToUpdate) {
      try {
        await RecommendationEngine.updateProductScore(productId);
        updateTracker.pendingProducts.delete(productId);
      } catch (error) {
        console.error(`Failed to update product ${productId}:`, error);
        // Keep in queue for retry, but don't block others
      }
    }

    
  } catch (error) {
    console.error('Smart score update failed:', error);
  } finally {
    updateTracker.updateInProgress = false;
    updateTracker.lastFullUpdate = new Date();
  }
}

/**
 * Debounced version to prevent excessive updates
 */
let debounceTimeout: NodeJS.Timeout | null = null;
function processPendingUpdatesDebounced(): void {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  
  debounceTimeout = setTimeout(() => {
    void processPendingUpdates();
  }, 1000); // 1 second debounce
}

/**
 * Force a full update of all products (fallback for edge cases)
 * This should be called sparingly, mainly by the daily cron job
 */
export async function forceFullUpdate(): Promise<void> {
  if (updateTracker.updateInProgress) {
    return;
  }

  updateTracker.updateInProgress = true;
  
  try {
    await recalculateAllProductMetrics();
    await RecommendationEngine.updateAllProductScores();
    
    // Clear pending queue since we updated everything
    updateTracker.pendingProducts.clear();
    updateTracker.lastFullUpdate = new Date();
    
  } catch (error) {
    console.error('Full update failed:', error);
    throw error;
  } finally {
    updateTracker.updateInProgress = false;
  }
}

/**
 * Get current update status
 */
export function getUpdateStatus() {
  return {
    lastUpdate: updateTracker.lastFullUpdate,
    pendingProducts: updateTracker.pendingProducts.size,
    updateInProgress: updateTracker.updateInProgress,
    timeSinceLastUpdate: Date.now() - updateTracker.lastFullUpdate.getTime(),
  };
}

/**
 * Manually trigger updates for specific products (admin use)
 */
export async function triggerManualUpdate(productIds: number[]): Promise<void> {
  for (const productId of productIds) {
    updateTracker.pendingProducts.add(productId);
  }
  
  await processPendingUpdates();
}