'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline'
import MainLayout from '@/components/layout/main-layout'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { OrderWithItems } from '@/types'
import { formatPrice } from '@/lib/cart-utils'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/orders/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        } else if (response.status === 403) {
          throw new Error('Access denied')
        } else {
          throw new Error('Failed to fetch order')
        }
      }

      const data = await response.json()
      setOrder(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order'
      setError(errorMessage)
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <ClockIcon className="h-6 w-6 text-yellow-500" />,
          color: 'bg-yellow-100 text-yellow-800',
          description: 'Your order is being processed'
        }
      case 'PAID':
        return {
          icon: <CheckCircleIcon className="h-6 w-6 text-blue-500" />,
          color: 'bg-blue-100 text-blue-800',
          description: 'Payment confirmed, preparing for shipment'
        }
      case 'FULFILLED':
        return {
          icon: <TruckIcon className="h-6 w-6 text-green-500" />,
          color: 'bg-green-100 text-green-800',
          description: 'Your order has been shipped'
        }
      case 'CANCELLED':
        return {
          icon: <XCircleIcon className="h-6 w-6 text-red-500" />,
          color: 'bg-red-100 text-red-800',
          description: 'This order has been cancelled'
        }
      default:
        return {
          icon: <ClockIcon className="h-6 w-6 text-gray-500" />,
          color: 'bg-gray-100 text-gray-800',
          description: 'Order status unknown'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateSubtotal = () => {
    if (!order) return 0
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return subtotal * 0.085 // 8.5% tax
  }

  const calculateShipping = () => {
    const subtotal = calculateSubtotal()
    return subtotal >= 50 ? 0 : 9.99
  }

  if (loading) {
    return (
      <MainLayout>
        <ProtectedRoute>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center items-center py-16">
              <Loading size="lg" />
            </div>
          </div>
        </ProtectedRoute>
      </MainLayout>
    )
  }

  if (error || !order) {
    return (
      <MainLayout>
        <ProtectedRoute>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  {error || 'Order not found'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {error === 'Order not found' 
                    ? 'The order you\'re looking for doesn\'t exist or has been removed.'
                    : error === 'Access denied'
                    ? 'You don\'t have permission to view this order.'
                    : 'There was an error loading the order details.'
                  }
                </p>
                <div className="space-x-4">
                  <Button onClick={() => router.back()}>
                    Go Back
                  </Button>
                  <Link href="/orders">
                    <Button variant="outline">
                      View All Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </ProtectedRoute>
      </MainLayout>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const subtotal = calculateSubtotal()
  const tax = calculateTax()
  const shipping = calculateShipping()

  return (
    <MainLayout>
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/orders" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-600">
                  Placed on {formatDate(order.createdAt.toString())}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  {statusInfo.icon}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{statusInfo.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">
                    Order Items ({order.items.length})
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                        <div className="flex-shrink-0">
                          <Image
                            src={item.product.images[0] || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-md object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">
                            <Link 
                              href={`/products/${item.product.slug}`}
                              className="hover:text-indigo-600"
                            >
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.product.category}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: {formatPrice(item.price)}</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary & Details */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">
                    Order Summary
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-gray-900">
                        {shipping === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          formatPrice(shipping)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(tax)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-gray-900">Total</span>
                        <span className="text-base font-medium text-gray-900">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">
                    Order Details
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Order ID:</span>
                      <p className="font-mono text-gray-900">{order.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Payment ID:</span>
                      <p className="font-mono text-gray-900">
                        {order.stripePaymentIntentId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Order Date:</span>
                      <p className="text-gray-900">
                        {formatDate(order.createdAt.toString())}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <p className="text-gray-900">
                        {formatDate(order.updatedAt.toString())}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                {order.status === 'DELIVERED' && (
                  <Button className="w-full">
                    Reorder Items
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  Download Invoice
                </Button>
                <Link href="/contact" className="block">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </MainLayout>
  )
}