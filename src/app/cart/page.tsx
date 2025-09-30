'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBagIcon } from '@heroicons/react/24/outline'
import MainLayout from '@/components/layout/main-layout'
import { useCartStore } from '@/stores/cart-store'
import CartItem from '@/components/cart/cart-item'
import CartSummary from '@/components/cart/cart-summary'
import Button from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CartPage() {
  const { items, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearCart}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBagIcon className="mx-auto h-24 w-24 text-gray-400" />
            <h2 className="mt-4 text-2xl font-medium text-gray-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. 
              Start shopping to fill it up!
            </p>
            <div className="mt-8">
              <Link href="/products">
                <Button size="lg">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">
                    Items in your cart ({items.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.productId} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                        <CartItem item={item} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Continue Shopping */}
              <div className="mt-6">
                <Link href="/products">
                  <Button variant="outline" className="w-full sm:w-auto">
                    ← Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">
                    Order Summary
                  </h2>
                </CardHeader>
                <CardContent>
                  <CartSummary />
                  
                  <div className="mt-6 space-y-3">
                    <Link href="/checkout" className="block">
                      <Button className="w-full" size="lg">
                        Proceed to Checkout
                      </Button>
                    </Link>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Secure checkout powered by Stripe
                      </p>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Secure SSL encryption
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        30-day return policy
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Free shipping over $50
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}