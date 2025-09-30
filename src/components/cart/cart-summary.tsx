'use client'

import { useCartStore } from '@/stores/cart-store'
import { getCartSummary, formatPrice } from '@/lib/cart-utils'

export default function CartSummary() {
  const { items } = useCartStore()
  const summary = getCartSummary(items)

  return (
    <div className="space-y-3">
      {/* Free Shipping Progress */}
      {summary.freeShippingRemaining > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Add {formatPrice(summary.freeShippingRemaining)} more for free shipping!
          </p>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (summary.subtotal / summary.freeShippingThreshold) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Summary Details */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Subtotal ({summary.itemsCount} {summary.itemsCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-gray-900">
            {formatPrice(summary.subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium text-gray-900">
            {summary.shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(summary.shipping)
            )}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium text-gray-900">
            {formatPrice(summary.tax)}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-base font-medium text-gray-900">
              {formatPrice(summary.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Savings Message */}
      {summary.shipping === 0 && summary.subtotal >= summary.freeShippingThreshold && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800 font-medium">
            🎉 You saved {formatPrice(9.99)} on shipping!
          </p>
        </div>
      )}
    </div>
  )
}