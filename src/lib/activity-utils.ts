import { ActivityType } from '@prisma/client';

// Get or generate session ID for guest users
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const key = 'ecommerce_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

// Track user activity
export async function trackActivity(params: {
  productId: string;
  activityType: ActivityType;
  userId?: string;
}): Promise<void> {
  try {
    const { productId, activityType, userId } = params;
    
    await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        activityType,
        userId: userId || undefined,
        sessionId: userId ? undefined : getSessionId(),
      }),
    });
  } catch (error) {
    // Silently fail - don't break user experience
  }
}

// Debounced activity tracking for views
const viewTrackingCache = new Set<string>();

export function trackView(productId: string, userId?: string): void {
  const cacheKey = `${productId}_${userId || getSessionId()}`;
  
  // Only track once per session per product
  if (viewTrackingCache.has(cacheKey)) {
    return;
  }
  
  viewTrackingCache.add(cacheKey);
  trackActivity({ productId, activityType: 'VIEW', userId });
}

// Intersection Observer for view tracking
export function createViewTracker(userId?: string) {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return null;
  }

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const productId = entry.target.getAttribute('data-product-id');
          if (productId) {
            trackView(productId, userId);
          }
        }
      });
    },
    {
      threshold: 0.5,
      rootMargin: '0px 0px -10% 0px',
    }
  );
}