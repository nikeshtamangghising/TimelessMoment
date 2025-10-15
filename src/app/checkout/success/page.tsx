'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import MainLayout from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'

interface PaymentDetails {
  id: string
  amount: number
  currency: string
  status: string
  created: number
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const paymentIntentId = searchParams.get('payment_intent')
  const method = searchParams.get('method')
  const transactionId = searchParams.get('transaction_id')
  const { isAuthenticated } = useAuth()
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (paymentIntentId) {
      fetchPaymentDetails()
    } else if (method === 'cod') {
      // For COD orders, we don't need to fetch payment details
      setLoading(false)
    } else {
      setError('No payment information found')
      setLoading(false)
    }
  }, [paymentIntentId, method])

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/checkout/payment-intent/${paymentIntentId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment details')
      }

      const data = await response.json()
      setPaymentDetails(data)
    } catch (err) {
      setError('Failed to load payment information')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Loading size="lg" />
            <p className="mt-4 text-gray-600">Processing your payment...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error && method !== 'cod') {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Information Unavailable
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'We couldn\'t retrieve your payment information.'}
              </p>
              <div className="space-x-4">
                <Link href={isAuthenticated ? "/orders" : "/guest-orders"}>
                  <Button>View Orders</Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline">Continue Shopping</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardContent className="p-8">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h1>
              <p className="text-lg text-gray-600">
                Thank you for your purchase. Your order has been confirmed.
              </p>
            </div>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Payment ID:</span>
                    <p className="font-mono text-gray-900">{paymentDetails.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-semibold text-gray-900">
                      {formatAmount(paymentDetails.amount, paymentDetails.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-semibold text-green-600 capitalize">
                      {paymentDetails.status}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="text-gray-900">
                      {formatDate(paymentDetails.created)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* COD Payment Details */}
            {method === 'cod' && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Payment Method:</span>
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Transaction ID:</span>
                    <p className="font-mono text-gray-900">{transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-semibold text-green-600">Order Confirmed</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="text-gray-900">
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                What's Next?
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-indigo-600 font-semibold text-xs">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Order Confirmation</p>
                    <p>You'll receive an email confirmation with your order details shortly.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-indigo-600 font-semibold text-xs">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Processing</p>
                    <p>We'll prepare your order for shipment within 1-2 business days.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-indigo-600 font-semibold text-xs">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Shipping</p>
                    <p>You'll receive tracking information once your order ships.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isAuthenticated ? "/orders" : "/guest-orders"}>
                <Button size="lg" className="w-full sm:w-auto">
                  View Order Status
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </Link>
            </div>

            {/* Guest User Information */}
            {!isAuthenticated && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Guest Checkout
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You checked out as a guest. You can track your order using the email address you provided.
                        <Link href="/guest-orders" className="font-medium underline hover:text-blue-600 ml-1">
                          Track your order here
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Support */}
            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Need help with your order?{' '}
                <Link href="/contact" className="text-indigo-600 hover:text-indigo-500">
                  Contact our support team
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Loading size="lg" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </MainLayout>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
