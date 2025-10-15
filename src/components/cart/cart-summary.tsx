'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { getCartSummary, formatPrice } from '@/lib/cart-utils'
import Loading from '@/components/ui/loading'

interface CartSummary {
  subtotal: number
  shipping: number
  tax: number
  total: number
  itemsCount: number
  freeShippingThreshold: number
  freeShippingRemaining: number
  taxRate?: number
  shippingRate?: number
}

export default function CartSummary() {
  const { items } = useCartStore()
  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (items.length > 0) {
      fetchCartSummary()
    } else {
      setSummary(null)
    }
  }, [items])

  const fetchCartSummary = async () => {
    try {
      setLoading(true)
      
      // Validate items before sending
      if (!items || items.length === 0) {
        setSummary(null)
        return
      }
      
      // Use API endpoint to get accurate calculations with database settings
      // Send minimal payload to match API schema
      const response = await fetch('/api/cart/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to calculate cart summary: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.summary) {
        setSummary(data.summary)
      } else {
        throw new Error('Invalid response format from API')
      }
    } catch (err) {
      // Fallback to hardcoded values if API call fails
      const fallbackSummary = getCartSummary(items)
      setSummary({
        ...fallbackSummary,
        taxRate: 0.13,
        shippingRate: 200
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loading size="sm" />
      </div>
    )
  }

  if (!summary || items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Your cart is empty</p>
      </div>
    )
  }

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
            🎉 You saved {formatPrice(summary.shippingRate || 200)} on shipping!
          </p>
        </div>
      )}
    </div>
  )
}