'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CheckoutForm from '@/components/checkout/checkout-form'
import OrderSummary from '@/components/checkout/order-summary'
import AddressForm from '@/components/addresses/address-form'
import EnhancedAddressSelector from '@/components/addresses/enhanced-address-selector'
import { useCartStore } from '@/stores/cart-store'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PaymentMethod } from '@/lib/payment-gateways'
import { Address } from '@/types'

interface CheckoutAddress {
  fullName: string
  email: string
  phone?: string
  address: string
  city: string
  postalCode: string
  country?: string
}
import Loading from '@/components/ui/loading'
import Button from '@/components/ui/button'

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [guestEmail, setGuestEmail] = useState<string>('')
  const [selectedAddress, setSelectedAddress] = useState<CheckoutAddress | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Redirect if cart is empty
    if (items.length === 0) {
      router.push('/cart')
      return
    }

    // Calculate order total
    if (!authLoading && items.length > 0) {
      calculateOrderTotal()
    }
  }, [mounted, authLoading, items, router])

  const calculateOrderTotal = async () => {
    setLoading(true)
    setError('')

    try {
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to calculate order total: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setOrderTotal(data.summary.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while calculating order total'
      setError(errorMessage)
      console.error('Error calculating order total:', err)
      // Even if there's an error calculating the total, we should still allow the user to proceed
      // Set a default total or use the client-side calculation
      const fallbackTotal = items.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0)
      setOrderTotal(fallbackTotal)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentInitiate = async (method: PaymentMethod) => {
    try {
      if (!selectedAddress) {
        throw new Error('Please select a shipping address')
      }

      const response = await fetch('/api/checkout/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          guestEmail: !isAuthenticated ? guestEmail : undefined,
          shippingAddress: selectedAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initiate payment')
      }

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          paymentUrl: data.paymentUrl,
          transactionId: data.transactionId,
        }
      } else {
        return {
          success: false,
          error: data.error || 'Payment initiation failed',
        }
      }
    } catch (err) {
      console.error('Error initiating payment:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Payment initiation failed',
      }
    }
  }

  const handlePaymentSuccess = async (paymentMethod: PaymentMethod, transactionId?: string) => {
    try {
      // For COD, create an order immediately before clearing the cart
      if (paymentMethod === 'cod' && selectedAddress) {
        const orderData = {
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: (item.product.discountPrice || item.product.price),
          })),
          total: items.reduce((sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity, 0),
          shippingAddress: selectedAddress,
        }

        // Use different API endpoints based on authentication status
        const apiEndpoint = isAuthenticated ? '/api/orders/create' : '/api/orders/create-guest'
        
        // Add guest-specific data if not authenticated
        if (!isAuthenticated) {
          (orderData as any).guestEmail = selectedAddress?.email || '';
          (orderData as any).guestName = selectedAddress?.fullName || '';
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })
        
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create order')
        }

        const result = await response.json()
        console.log('Order created successfully:', result)
      }
    } catch (err) {
      console.error('Order creation failed:', err)
      // Do not clear the cart if order creation failed
      return
    }

    // Clear cart after successful order/payment
    clearCart()

    // Redirect to success page with payment details
    const params = new URLSearchParams({
      method: paymentMethod,
      ...(transactionId && { transaction_id: transactionId }),
    })
    router.push(`/checkout/success?${params.toString()}`)
  }

  const handleAddressSelect = (address: Address | null) => {
    // Convert Address to CheckoutAddress format
    if (address) {
      setSelectedAddress({
        fullName: address.fullName,
        email: address.email,
        phone: address.phone || undefined,
        address: address.address,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country || 'Nepal'
      })
    } else {
      setSelectedAddress(null)
    }
  }

  const handleAddressSave = (address: Address) => {
    // Convert Address to CheckoutAddress format
    setSelectedAddress({
      fullName: address.fullName,
      email: address.email,
      phone: address.phone || undefined,
      address: address.address,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country || 'Nepal'
    })
  }

  if (!mounted || authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-16">
          <Loading size="lg" />
        </div>
      </div>
    )
  }

  if (error && !selectedAddress) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Checkout Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/cart')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Return to Cart
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-2 text-gray-600">
          Complete your purchase securely
        </p>
        {!isAuthenticated && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Checking out as guest.
                  <Link href={`/auth/signin?redirect=/checkout`} className="font-medium underline hover:text-blue-600">
                    Sign in
                  </Link>
                  {' '}or{' '}
                  <Link href={`/auth/signup?redirect=/checkout`} className="font-medium underline hover:text-blue-600">
                    create an account
                  </Link>
                  {' '}to Add New Addresses and track your orders.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Unified Checkout Flow */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Enter Shipping Information
              </h2>
              <p className="text-sm text-gray-600">
                Add or select your shipping address to continue
              </p>
            </CardHeader>
            <CardContent>
              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">1</span>
                    </div>
                    <div className="ml-3 text-sm font-medium text-blue-600">
                      <div className="font-semibold">Step 1: Shipping Address</div>
                      <div className="text-xs text-blue-500">Select or enter your address</div>
                    </div>
                  </div>
                  <div className="flex-1 mx-4 h-0.5 bg-blue-200"></div>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedAddress ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`text-sm font-medium ${
                        selectedAddress ? 'text-white' : 'text-gray-500'
                      }`}>2</span>
                    </div>
                    <div className={`ml-3 text-sm font-medium ${
                      selectedAddress ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      <div className="font-semibold">Step 2: Payment & Place Order</div>
                      <div className="text-xs text-gray-500">Complete your purchase</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Selection Section */}
              <div className={`transition-all duration-300 ${selectedAddress ? 'mb-0' : 'mb-6'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Shipping Information
                  </h3>
                  {!selectedAddress && (
                    <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                      Required
                    </div>
                  )}
                </div>
                {isAuthenticated ? (
                  <EnhancedAddressSelector
                    type="SHIPPING"
                    selectedAddress={selectedAddress}
                    onAddressSelect={handleAddressSelect}
                    onAddressSave={handleAddressSave}
                  />
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      As a guest, you'll need to enter your shipping address for this order.
                    </p>
                    {!showAddressForm && !selectedAddress ? (
                      <div className="space-y-4">
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                          <div className="mb-3">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Add Your Shipping Address</h4>
                          <p className="text-sm text-gray-500 mb-4">
                            Enter your address to continue with your order
                          </p>
                          <Button onClick={() => setShowAddressForm(true)} className="w-full" size="lg">
                            Enter Shipping Address
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            This address will only be used for this order
                          </p>
                        </div>
                      </div>
                    ) : !showAddressForm && selectedAddress ? (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Selected Address:</h4>
                            <div className="text-sm text-gray-600">
                              <div className="font-medium">{selectedAddress.fullName}</div>
                              <div>{selectedAddress.address}</div>
                              <div>{selectedAddress.city}, {selectedAddress.postalCode}</div>
                              <div>{selectedAddress.email}</div>
                              {selectedAddress.phone && <div>{selectedAddress.phone}</div>}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddressForm(true)}
                            size="sm"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <AddressForm
                          onSubmit={async (addressData) => {
                            setSelectedAddress({
                              fullName: addressData.fullName,
                              email: addressData.email,
                              phone: addressData.phone,
                              address: addressData.address,
                              city: addressData.city,
                              postalCode: addressData.postalCode,
                              country: addressData.country
                            })
                            setShowAddressForm(false)
                          }}
                          onCancel={() => setShowAddressForm(false)}
                          title="Shipping Address"
                          submitLabel="Use This Address"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setShowAddressForm(false)}
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Section - Appears when address is selected */}
              {selectedAddress && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Payment Information
                    </h3>
                    <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Ready to Order
                    </div>
                  </div>
                  
                  {/* Selected Address Summary */}
                  <div className="mb-5 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-600">
                        <div className="font-medium text-gray-900">{selectedAddress?.fullName}</div>
                        <div>{selectedAddress?.address}</div>
                        <div>{selectedAddress?.city}, {selectedAddress?.postalCode}</div>
                        <div>{selectedAddress?.email}</div>
                        {selectedAddress?.phone && <div>{selectedAddress.phone}</div>}
                      </div>
                      {!isAuthenticated && (
                        <Button
                          variant="outline"
                          onClick={() => setShowAddressForm(true)}
                          size="sm"
                        >
                          Change
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Show error message if there was an issue calculating order total */}
                  {error && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        Note: There was an issue calculating your order total. We'll use a fallback calculation for now.
                      </p>
                    </div>
                  )}

                  {/* Success Message */}
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Address selected! Ready to proceed with payment.
                    </p>
                  </div>

                  {/* CheckoutForm */}
                  <CheckoutForm
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => setError(error)}
                    orderTotal={orderTotal}
                    isGuest={!isAuthenticated}
                    guestEmail={guestEmail}
                    onGuestEmailChange={setGuestEmail}
                    onPaymentInitiate={handlePaymentInitiate}
                    selectedAddress={selectedAddress}
                  />
                </div>
              )}

              {/* Prominent Place Order Button - Always visible when address is selected */}
              {selectedAddress && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-6">
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Order Total</span>
                          <div className="text-xs text-gray-500">Cash on Delivery</div>
                        </div>
                        <span className="text-2xl font-bold text-green-700">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(orderTotal)}
                        </span>
                      </div>
                      <Button
                        onClick={() => handlePaymentSuccess('cod', `cod-${Date.now()}`)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                      >
                        🛒 Place Order Now
                      </Button>
                      <p className="text-xs text-gray-600 mt-2 text-center">
                        You will pay in cash when your order is delivered
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback: Show message if no address selected and user has been on page for a while */}
              {mounted && !selectedAddress && !loading && !authLoading && (
                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-semibold text-blue-900">Almost there! Complete your order in 2 steps:</h4>
                      <div className="mt-2 text-sm text-blue-700 space-y-1">
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <span>
                            {isAuthenticated
                              ? "Select or add a shipping address above"
                              : "Enter your shipping address above"
                            }
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                          <span>Choose payment method and place your order</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <OrderSummary items={items} />
        </div>
      </div>
    </div>
  )
}