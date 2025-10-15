'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon, ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon, PencilIcon } from '@heroicons/react/24/outline'
import MainLayout from '@/components/layout/main-layout'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import ShippingAddressForm from '@/components/orders/shipping-address-form'
import { OrderWithItems } from '@/types'
import { formatPrice } from '@/lib/cart-utils'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Extend the OrderWithItems type to include shippingAddress
interface OrderWithItemsAndShipping extends OrderWithItems {
  shippingAddress: any | null;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderWithItemsAndShipping | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editingAddress, setEditingAddress] = useState(false)
  const resolvedParams = use(params) // Unwrap the Promise to get the actual params

  useEffect(() => {
    fetchOrder()
  }, [resolvedParams.id])

  const fetchOrder = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}`)
      
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
    return subtotal * 0.13 // 13% tax (Nepal VAT)
  }

  const calculateShipping = () => {
    const subtotal = calculateSubtotal()
    return subtotal >= 2000 ? 0 : 200 // Free shipping over 2000 NPR, otherwise 200 NPR
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    const shipping = calculateShipping()
    return subtotal + tax + shipping
  }

  const handleAddressSave = (updatedAddress: any) => {
    if (order) {
      setOrder({
        ...order,
        shippingAddress: updatedAddress
      })
      setEditingAddress(false)
    }
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

  // Extract shipping address if available
  const shippingAddress = order.shippingAddress || null

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-600">
                  Placed on {formatDate(order.createdAt.toString())}
                </p>
              </div>
              <div className="flex items-center">
                {statusInfo.icon}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {order.status}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{statusInfo.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
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
                            {item.product.category?.name || 'Unknown Category'}
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
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                      Customer Information
                    </h2>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => setEditingAddress(true)}
                        className="text-indigo-600 hover:text-indigo-500"
                        title="Edit shipping address"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {order.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{order.user.name}</h3>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {order.user.role}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{order.user.email}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <p>Customer since: {new Date(order.user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Shipping Address Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          Shipping Address
                        </h3>
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => setEditingAddress(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Edit Address
                          </button>
                        )}
                      </div>
                      
                      {editingAddress ? (
                        <ShippingAddressForm
                          orderId={order.id}
                          initialAddress={shippingAddress}
                          onSave={handleAddressSave}
                          onCancel={() => setEditingAddress(false)}
                        />
                      ) : shippingAddress ? (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 text-lg">{shippingAddress.fullName}</p>
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                Primary
                              </span>
                            </div>
                            <div className="space-y-1 text-gray-700">
                              <p className="font-medium">{shippingAddress.address}</p>
                              <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
                              <p className="text-sm text-gray-600">{shippingAddress.country || 'Nepal'}</p>
                            </div>
                            <div className="pt-2 border-t border-blue-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                {shippingAddress.phone && (
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                    {shippingAddress.phone}
                                  </div>
                                )}
                                {shippingAddress.email && (
                                  <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    {shippingAddress.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-yellow-800 text-sm font-medium">No shipping address provided</p>
                          </div>
                          <p className="text-yellow-700 text-sm mt-1">Contact customer for delivery address</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      Order Summary
                    </h2>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Items Breakdown */}
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-600">Shipping</span>
                          {shipping === 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                              Free
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {shipping === 0 ? (
                            <span className="text-green-600 font-semibold">Free</span>
                          ) : (
                            formatPrice(shipping)
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (13% VAT)</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(tax)}
                        </span>
                      </div>
                      
                      {/* Free Shipping Progress */}
                      {shipping > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-800 font-medium">
                              Add {formatPrice(2000 - subtotal)} more for free shipping
                            </span>
                            <div className="w-20 bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((subtotal / 2000) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <div className="text-right">
                          <span className="text-xl font-bold text-gray-900">
                            {formatPrice(calculateTotal())}
                          </span>
                          <p className="text-xs text-gray-500">NPR (Nepalese Rupees)</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium text-gray-900">
                          {order.stripePaymentIntentId ? 'Online Payment' : 'Cash on Delivery'}
                        </span>
                      </div>
                      {order.stripePaymentIntentId && (
                        <div className="mt-1 text-xs text-gray-500">
                          Payment ID: {order.stripePaymentIntentId.slice(-8).toUpperCase()}
                        </div>
                      )}
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
                  <div className="space-y-4">
                    {/* Order Information */}
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                          </svg>
                          Order ID:
                        </span>
                        <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {order.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      
                      {order.trackingNumber && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            Tracking Number:
                          </span>
                          <span className="font-mono text-gray-900 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {order.trackingNumber}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                          </svg>
                          Payment Method:
                        </span>
                        <span className="font-medium text-gray-900">
                          {order.stripePaymentIntentId ? 'Online Payment' : 'Cash on Delivery'}
                        </span>
                      </div>
                      
                      {order.stripePaymentIntentId && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Payment ID:
                          </span>
                          <span className="font-mono text-gray-900 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {order.stripePaymentIntentId.slice(-8).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Order Placed</p>
                            <p className="text-xs text-gray-500">{formatDate(order.createdAt.toString())}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}>
                            <svg className={`w-4 h-4 ${
                              ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Payment Confirmed</p>
                            <p className="text-xs text-gray-500">
                              {order.stripePaymentIntentId ? 'Online payment processed' : 'Cash on delivery'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            ['SHIPPED', 'DELIVERED'].includes(order.status) 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}>
                            <svg className={`w-4 h-4 ${
                              ['SHIPPED', 'DELIVERED'].includes(order.status) 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Order Shipped</p>
                            <p className="text-xs text-gray-500">
                              {order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Preparing for shipment'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            order.status === 'DELIVERED' 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}>
                            <svg className={`w-4 h-4 ${
                              order.status === 'DELIVERED' 
                                ? 'text-green-600' 
                                : 'text-gray-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Delivered</p>
                            <p className="text-xs text-gray-500">
                              {order.status === 'DELIVERED' ? 'Order completed' : 'Pending delivery'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-900 font-medium">
                          {formatDate(order.updatedAt.toString())}
                        </span>
                      </div>
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