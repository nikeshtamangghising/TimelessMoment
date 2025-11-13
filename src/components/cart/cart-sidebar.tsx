'use client'

import { Fragment, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ShoppingBagIcon, TruckIcon, GiftIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/stores/cart-store'
import { getFreeShippingThreshold, DEFAULT_CURRENCY } from '@/lib/currency'
import CartItem from './cart-item'
import CartSummary from './cart-summary'
import Button from '@/components/ui/button'
import Link from 'next/link'

export default function CartSidebar() {
  const { items, isOpen, closeCart, getTotalItems, getTotalPrice } = useCartStore()
  
  // Shipping threshold calculations
  const FREE_SHIPPING_THRESHOLD = getFreeShippingThreshold(DEFAULT_CURRENCY)
  const totalPrice = useMemo(() => getTotalPrice(), [items])
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice
  const qualifiesForFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart} suppressHydrationWarning>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" suppressHydrationWarning />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden" suppressHydrationWarning>
          <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10" suppressHydrationWarning>
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md" suppressHydrationWarning>
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl" suppressHydrationWarning>
                    {/* Header */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6" suppressHydrationWarning>
                      <div className="flex items-start justify-between" suppressHydrationWarning>
                        <Dialog.Title className="text-lg font-medium text-gray-900" suppressHydrationWarning>
                          Shopping Cart ({getTotalItems()})
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center" suppressHydrationWarning>
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={closeCart}
                            suppressHydrationWarning
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Shipping Threshold Banner - Show only when items exist */}
                      {items.length > 0 && (
                        <div className="mt-6" suppressHydrationWarning>
                          {qualifiesForFreeShipping ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3" suppressHydrationWarning>
                              <div className="flex-shrink-0" suppressHydrationWarning>
                                <TruckIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="flex-1" suppressHydrationWarning>
                                <p className="text-sm font-medium text-green-800">
                                  🎉 You qualify for FREE shipping!
                                </p>
                                <p className="text-sm text-green-600">
                                  Your order will be delivered at no extra cost
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" suppressHydrationWarning>
                              <div className="flex items-center space-x-3 mb-2" suppressHydrationWarning>
                                <TruckIcon className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">
                  Add NPR {remainingForFreeShipping.toFixed(2)} more for FREE shipping!
                </p>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2" suppressHydrationWarning>
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                                  suppressHydrationWarning
                                ></div>
                              </div>
              <p className="text-xs text-blue-600 mt-1">
                NPR {totalPrice.toFixed(2)} of NPR {FREE_SHIPPING_THRESHOLD} required
              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cart Items */}
                      <div className="mt-6" suppressHydrationWarning>
                        {items.length === 0 ? (
                          <div className="text-center py-12" suppressHydrationWarning>
                            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                              Your cart is empty
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Start adding some items to your cart!
                            </p>
                            <div className="mt-6 space-y-3" suppressHydrationWarning>
                              <Link href="/categories">
                                <Button onClick={closeCart} className="w-full">
                                  Browse Categories
                                </Button>
                              </Link>
                              <Link href="/products">
                                <Button variant="outline" onClick={closeCart} className="w-full">
                                  View All Products
                                </Button>
                              </Link>
                            </div>
                            
                            {/* Shopping Incentives */}
                            <div className="mt-8 space-y-4" suppressHydrationWarning>
                              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500" suppressHydrationWarning>
                                <TruckIcon className="h-4 w-4" />
                <span>Free shipping over NPR 7,500</span>
                              </div>
                              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500" suppressHydrationWarning>
                                <GiftIcon className="h-4 w-4" />
                                <span>Easy 30-day returns</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flow-root" suppressHydrationWarning>
                            <ul role="list" className="-my-6 divide-y divide-gray-200" suppressHydrationWarning>
                              {items.map((item) => (
                                <li key={item.productId} className="py-6" suppressHydrationWarning>
                                  <CartItem item={item} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6" suppressHydrationWarning>
                        <CartSummary />
                        
                        <div className="mt-6 space-y-3" suppressHydrationWarning>
                          <Link href="/checkout" className="block">
                            <Button 
                              className="w-full" 
                              size="lg"
                              onClick={closeCart}
                            >
                              Checkout
                            </Button>
                          </Link>
                          
                          <Link href="/products" className="block">
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={closeCart}
                            >
                              Continue Shopping
                            </Button>
                          </Link>
                        </div>

                        <div className="mt-6 flex justify-center text-center text-sm text-gray-500" suppressHydrationWarning>
                          <p suppressHydrationWarning>
                            or{' '}
                            <button
                              type="button"
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                              onClick={closeCart}
                              suppressHydrationWarning
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}