// Dynamic imports for code splitting and lazy loading
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import Loading from '@/components/ui/loading'

// Loading component for dynamic imports
const DynamicLoading = () => <Loading size="lg" />

// Admin components (heavy, only load when needed)
export const DynamicAdminLayout = dynamic(
  () => import('@/components/admin/admin-layout'),
  {
    loading: DynamicLoading,
    ssr: false, // Admin components don't need SSR
  }
)

export const DynamicProductForm = dynamic(
  () => import('@/components/admin/product-form'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
)



// Checkout components (only needed on checkout flow)
export const DynamicCheckoutForm = dynamic(
  () => import('@/components/checkout/checkout-form'),
  {
    loading: DynamicLoading,
  }
)


// Cart components (frequently used but can be lazy loaded)
export const DynamicCartSidebar = dynamic(
  () => import('@/components/cart/cart-sidebar'),
  {
    loading: () => <div className="w-96 h-screen bg-gray-100 animate-pulse" />,
  }
)

// Modal components (only load when opened)
export const DynamicModal = dynamic(
  () => import('@/components/ui/modal'),
  {
    loading: () => null, // No loading state for modals
    ssr: false,
  }
)









// Utility function to create dynamic component with custom loading
export function createDynamicComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: () => JSX.Element
    ssr?: boolean
    suspense?: boolean
  } = {}
) {
  const { loading = DynamicLoading, ssr = true, suspense = false } = options

  return dynamic(importFn, {
    loading,
    ssr,
    suspense,
  })
}

// Preload critical dynamic components
export function preloadCriticalComponents(): void {
  if (typeof window === 'undefined') return

  // Only preload if user is likely to use these components
  const shouldPreload = () => {
    // Check if user is on a page where these components might be used
    const path = window.location.pathname
    return path.includes('/cart') || path.includes('/product') || path.includes('/admin')
  }

  if (!shouldPreload()) return

  // Preload components that are likely to be used soon
  const criticalComponents = [
    () => import('@/components/cart/cart-sidebar'),
    () => import('@/components/ui/modal'),
  ]

  criticalComponents.forEach(importFn => {
    // Preload with low priority and only after a delay
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFn().catch(() => {
          // Ignore preload errors
        })
      }, { timeout: 5000 })
    } else {
      setTimeout(() => {
        importFn().catch(() => {
          // Ignore preload errors
        })
      }, 3000)
    }
  })
}

// Component lazy loading with intersection observer
export function createLazyComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: () => JSX.Element
) {
  return dynamic(importFn, {
    loading: fallback || DynamicLoading,
    ssr: false,
  })
}
