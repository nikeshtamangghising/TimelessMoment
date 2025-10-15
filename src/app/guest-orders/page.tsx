'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import ConvertGuestAccount from '@/components/account/convert-guest-account'
import MainLayout from '@/components/layout/main-layout'
import { OrderWithItems } from '@/types'

export default function GuestOrdersPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const response = await fetch(`/api/orders/guest/${encodeURIComponent(email)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.data.data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Track Your Orders</h1>
        <p className="mt-2 text-gray-600">
          Enter your email address to view your order history
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Order Lookup</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email address"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loading size="sm" /> : 'Search Orders'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {searched && !loading && orders.length === 0 && !error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 mb-4">
                We couldn&apos;t find any orders for this email address.
              </p>
              <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Continue Shopping
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <div className="space-y-6">
          {/* Account Conversion Component */}
          <ConvertGuestAccount 
            guestEmail={email}
            onSuccess={() => {
              // Optionally refresh orders or redirect
              router.push('/auth/signin?message=Account created successfully! Please sign in to view your orders.')
            }}
          />

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Orders ({orders.length})
            </h2>
            <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Continue Shopping
            </Link>
          </div>

          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt.toString())}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                              {item.product.images && item.product.images.length > 0 ? (
                                <Image
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                      <div className="text-sm text-gray-600">
                        <p>{(order.shippingAddress as any).fullName}</p>
                        <p>{(order.shippingAddress as any).address}</p>
                        <p>{(order.shippingAddress as any).city}, {(order.shippingAddress as any).postalCode}</p>
                        {(order.shippingAddress as any).phone && <p>{(order.shippingAddress as any).phone}</p>}
                      </div>
                    </div>
                  )}

                  {/* Tracking Number */}
                  {order.trackingNumber && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Tracking Number</h4>
                      <p className="text-sm text-gray-600 font-mono">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </MainLayout>
  )
}
