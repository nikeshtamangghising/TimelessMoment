'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MainLayout from '@/components/layout/main-layout'
import CheckoutForm from '@/components/checkout/checkout-form'
import CheckoutProgress from '@/components/checkout/checkout-progress'
import OrderSummary from '@/components/checkout/order-summary'
import TrustSignals from '@/components/checkout/trust-signals'
import { useCartStore } from '@/stores/cart-store'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PaymentMethod } from '@/lib/payment-gateways'
import Loading from '@/components/ui/loading'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [guestEmail, setGuestEmail] = useState<string>('')

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0) {
      router.push('/cart')
      return
    }

    // Calculate order total
    if (!authLoading && items.length > 0) {
      calculateOrderTotal()
    }
  }, [authLoading, items, router])

  const calculateOrderTotal = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/cart/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate order total')
      }

      const data = await response.json()
      setOrderTotal(data.summary.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Error calculating order total:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentInitiate = async (method: PaymentMethod) => {
    try {
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

  const handlePaymentSuccess = (paymentMethod: PaymentMethod, transactionId?: string) => {
    // Clear cart after successful payment
    clearCart()
    // Redirect to success page with payment details
    const params = new URLSearchParams({
      method: paymentMethod,
      ...(transactionId && { transaction_id: transactionId }),
    })
    router.push(`/checkout/success?${params.toString()}`)
  }

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <Loading size="lg" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
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
      </MainLayout>
    )
  }


  return (
    <MainLayout>
      <CheckoutProgress currentStep={2} />
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
                    {' '}to track your orders and save your information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Payment Information
                </h2>
              </CardHeader>
              <CardContent>
                <CheckoutForm
                  onSuccess={handlePaymentSuccess}
                  onError={(error) => setError(error)}
                  orderTotal={orderTotal}
                  isGuest={!isAuthenticated}
                  guestEmail={guestEmail}
                  onGuestEmailChange={setGuestEmail}
                  onPaymentInitiate={handlePaymentInitiate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <OrderSummary items={items} />
            <TrustSignals />
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure checkout with multiple payment options</span>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}