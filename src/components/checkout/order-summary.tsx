'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CartItem } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getCartSummary, formatPrice } from '@/lib/cart-utils'

interface OrderSummaryProps {
  items: CartItem[]
}

export default function OrderSummary({ items }: OrderSummaryProps) {
  const summary = getCartSummary(items)

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <h2 className="text-lg font-medium text-gray-900">
          Order Summary
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center space-x-4">
              <div className="flex-shrink-0 relative">
                <Image
                  src={item.product.images[0] || '/placeholder-product.jpg'}
                  alt={item.product.name}
                  width={60}
                  height={60}
                  className="w-15 h-15 rounded-md object-cover"
                />
                <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  <Link 
                    href={`/products/${item.product.slug}`}
                    className="hover:text-indigo-600"
                  >
                    {item.product.name}
                  </Link>
                </h4>
                <p className="text-sm text-gray-500">
                  {item.product.category}
                </p>
              </div>
              
              <div className="text-sm font-medium text-gray-900">
                {formatPrice(item.product.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
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

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="text-base font-medium text-gray-900">Total</span>
              <span className="text-base font-medium text-gray-900">
                {formatPrice(summary.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Free Shipping Message */}
        {summary.shipping === 0 && summary.subtotal >= summary.freeShippingThreshold && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              🎉 You saved {formatPrice(9.99)} on shipping!
            </p>
          </div>
        )}

        {/* Order Policies */}
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              30-day return policy
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              1-year warranty included
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure payment processing
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-500">
              Contact our support team
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}