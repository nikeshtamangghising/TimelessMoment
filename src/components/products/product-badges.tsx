'use client'

import { StarIcon, FireIcon, SparklesIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/solid'
import { ClockIcon } from '@heroicons/react/24/outline'
import { formatCurrency, getFreeShippingThreshold, DEFAULT_CURRENCY } from '@/lib/currency'

interface ProductBadgesProps {
  product: {
    id: string
    isFeatured?: boolean
    isNewArrival?: boolean
    inventory: number
    lowStockThreshold?: number
    ratingAvg?: number | null
    ratingCount?: number
    purchaseCount?: number
    viewCount?: number
    createdAt: string | Date
    price: number
  }
  showTrustSignals?: boolean
  className?: string
}

export default function ProductBadges({ 
  product, 
  showTrustSignals = true, 
  className = '' 
}: ProductBadgesProps) {
  const badges: JSX.Element[] = []
  const trustSignals: JSX.Element[] = []

  // Calculate if product is "new" (created within last 30 days)
  const isRecent = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const createdDate = new Date(product.createdAt)
    return createdDate > thirtyDaysAgo
  }

  // Calculate if product is "best seller" based on purchase count
  const isBestSeller = () => {
    return (product.purchaseCount || 0) >= 50 // Configurable threshold
  }

  // Calculate if product is "trending" based on recent views
  const isTrending = () => {
    return (product.viewCount || 0) >= 100 // Configurable threshold
  }

  // Sale Badge (if there's a discount)
  // Note: This would require discountPrice field in the future
  // For now, we'll check if product has a discount price
  if (product.discountPrice && product.discountPrice < product.price) {
    badges.push(
      <div key="sale" className="absolute top-2 left-2 z-10">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
          SALE
        </span>
      </div>
    )
  }

  // New Arrival Badge
  if (product.isNewArrival || isRecent()) {
    badges.push(
      <div key="new" className="absolute top-2 right-2 z-10">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
          <SparklesIcon className="w-3 h-3 mr-1" />
          New
        </span>
      </div>
    )
  }

  // Best Seller Badge
  if (isBestSeller()) {
    badges.push(
      <div key="bestseller" className="absolute top-2 left-2 z-10">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 shadow-sm">
          <StarIcon className="w-3 h-3 mr-1" />
          Best Seller
        </span>
      </div>
    )
  }

  // Trending Badge
  if (isTrending()) {
    badges.push(
      <div key="trending" className="absolute top-2 right-2 z-10">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 shadow-sm">
          <FireIcon className="w-3 h-3 mr-1" />
          Trending
        </span>
      </div>
    )
  }

  // Featured Badge
  if (product.isFeatured) {
    badges.push(
      <div key="featured" className="absolute top-2 left-2 z-10">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 shadow-sm">
          <StarIcon className="w-3 h-3 mr-1" />
          Featured
        </span>
      </div>
    )
  }

  // Low Stock Warning
  const lowStockThreshold = product.lowStockThreshold || 5
  if (product.inventory > 0 && product.inventory <= lowStockThreshold) {
    badges.push(
      <div key="lowstock" className="absolute bottom-2 right-2 z-10">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 shadow-sm">
          <ClockIcon className="w-3 h-3 mr-1" />
          Only {product.inventory} left
        </span>
      </div>
    )
  }

  // Trust Signals (if enabled)
  if (showTrustSignals) {
    // Free Shipping (for orders over threshold)
    if (product.price >= getFreeShippingThreshold()) {
      trustSignals.push(
        <div key="shipping" className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          <TruckIcon className="w-3 h-3 mr-1" />
          Free Shipping
        </div>
      )
    }

    // Fast Delivery
    trustSignals.push(
      <div key="delivery" className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
        <ClockIcon className="w-3 h-3 mr-1" />
        2-Day Delivery
      </div>
    )

    // Security/Quality Assurance
    trustSignals.push(
      <div key="secure" className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
        <ShieldCheckIcon className="w-3 h-3 mr-1" />
        Secure Purchase
      </div>
    )

    // High Rating Badge
    if (product.ratingAvg && product.ratingAvg >= 4.5 && (product.ratingCount || 0) >= 10) {
      trustSignals.push(
        <div key="rating" className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
          <StarIcon className="w-3 h-3 mr-1" />
          {product.ratingAvg.toFixed(1)} ({product.ratingCount}+)
        </div>
      )
    }
  }

  return (
    <div className={className}>
      {/* Product Badges (overlays) */}
      {badges.length > 0 && (
        <div className="relative">
          {badges}
        </div>
      )}

      {/* Trust Signals (below product info) */}
      {showTrustSignals && trustSignals.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {trustSignals}
        </div>
      )}
    </div>
  )
}

// Social Proof Component
interface SocialProofProps {
  product: {
    id: string
    purchaseCount?: number
    viewCount?: number
    ratingCount?: number
  }
  className?: string
}

export function SocialProofIndicators({ product, className = '' }: SocialProofProps) {
  const indicators: JSX.Element[] = []

  // Recent Purchase Activity
  if ((product.purchaseCount || 0) > 0) {
    const recentPurchases = Math.min(product.purchaseCount || 0, 99) // Cap at 99 for display
    indicators.push(
      <div key="purchases" className="text-xs text-gray-600">
        🔥 {recentPurchases}+ bought in the last 7 days
      </div>
    )
  }

  // People Viewing
  if ((product.viewCount || 0) > 50) {
    // Use a deterministic number based on viewCount to avoid hydration mismatch
    const viewing = Math.min(Math.floor((product.viewCount || 0) / 10) + 3, 15)
    indicators.push(
      <div key="viewing" className="text-xs text-gray-600">
        👀 {viewing} people are viewing this right now
      </div>
    )
  }

  // Popular Choice
  if ((product.ratingCount || 0) >= 20) {
    indicators.push(
      <div key="popular" className="text-xs text-green-600 font-medium">
        ⭐ Popular choice - highly rated by customers
      </div>
    )
  }

  if (indicators.length === 0) return null

  return (
    <div className={`space-y-1 ${className}`}>
      {indicators}
    </div>
  )
}

// Delivery Estimation Component
interface DeliveryEstimateProps {
  price: number
  className?: string
}

export function DeliveryEstimate({ price, className = '' }: DeliveryEstimateProps) {
  const getDeliveryDate = () => {
    const today = new Date()
    const deliveryDate = new Date(today)
    
    const freeShippingThreshold = getFreeShippingThreshold()
    if (price >= freeShippingThreshold) {
      // Free 2-day shipping for orders over threshold
      deliveryDate.setDate(today.getDate() + 2)
    } else {
      // Standard 5-7 day shipping
      deliveryDate.setDate(today.getDate() + 5)
    }

    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

  const freeShippingThreshold = getFreeShippingThreshold()
  const isFreeShipping = price >= freeShippingThreshold
  const deliveryDate = getDeliveryDate()

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <TruckIcon className="w-4 h-4 text-green-600" />
        <span className="text-sm">
          {isFreeShipping ? (
            <span className="text-green-600 font-medium">Free delivery by {deliveryDate}</span>
          ) : (
            <span className="text-gray-600">Delivery by {deliveryDate} - {formatCurrency(999, DEFAULT_CURRENCY)} shipping</span>
          )}
        </span>
      </div>
      
      {!isFreeShipping && (
        <div className="text-xs text-blue-600">
          💡 Add {formatCurrency(freeShippingThreshold - price, DEFAULT_CURRENCY)} more for free shipping
        </div>
      )}
    </div>
  )
}