'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  TruckIcon, 
  XCircleIcon,
  PencilIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import ShippingAddressForm from '@/components/orders/shipping-address-form'
import { OrderWithItems } from '@/types'
import { formatPrice } from '@/lib/cart-utils'

interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Extend the OrderWithItems type to include shippingAddress
interface OrderWithItemsAndShipping extends OrderWithItems {
  shippingAddress: any | null;
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderWithItemsAndShipping | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [editingAddress, setEditingAddress] = useState(false)
  const [showTrackingForm, setShowTrackingForm] = useState(false)
  const [trackingData, setTrackingData] = useState({
    status: 'PROCESSING',
    message: ''
  })
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
          description: 'Order is pending payment or confirmation'
        }
      case 'PROCESSING':
        return {
          icon: <CheckCircleIcon className="h-6 w-6 text-blue-500" />,
          color: 'bg-blue-100 text-blue-800',
          description: 'Order is being processed and prepared for shipment'
        }
      case 'SHIPPED':
        return {
          icon: <TruckIcon className="h-6 w-6 text-purple-500" />,
          color: 'bg-purple-100 text-purple-800',
          description: 'Order has been shipped to customer'
        }
      case 'DELIVERED':
        return {
          icon: <TruckIcon className="h-6 w-6 text-green-500" />,
          color: 'bg-green-100 text-green-800',
          description: 'Order has been delivered to customer'
        }
      case 'CANCELLED':
        return {
          icon: <XCircleIcon className="h-6 w-6 text-red-500" />,
          color: 'bg-red-100 text-red-800',
          description: 'This order has been cancelled'
        }
      case 'REFUNDED':
        return {
          icon: <XCircleIcon className="h-6 w-6 text-orange-500" />,
          color: 'bg-orange-100 text-orange-800',
          description: 'This order has been refunded'
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

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Refresh order data
      fetchOrder()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status'
      alert(errorMessage)
    }
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

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/orders/${resolvedParams.id}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add tracking information')
      }

      // Refresh order data
      fetchOrder()
      setShowTrackingForm(false)
      setTrackingData({
        status: 'PROCESSING',
        message: ''
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add tracking information'
      alert(errorMessage)
    }
  }

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center items-center py-16">
              <Loading size="lg" />
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  if (error || !order) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
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
                  <Link href="/admin/orders">
                    <Button variant="outline">
                      View All Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const subtotal = calculateSubtotal()
  const tax = calculateTax()
  const shipping = calculateShipping()

  // Extract shipping address if available
  const shippingAddress = order.shippingAddress || null

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin/orders" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.id.slice(-8).toUpperCase()}
                </h1>
                <p className="text-gray-600">
                  Placed on {formatDate(order.createdAt.toString())} by {order.user.name}
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
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          {order.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.user.name}</p>
                        <p className="text-gray-500 text-sm">{order.user.email}</p>
                      </div>
                    </div>
                    
                    {/* Shipping Address Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Shipping Address
                      </h3>
                      
                      {editingAddress ? (
                        <ShippingAddressForm
                          orderId={order.id}
                          initialAddress={shippingAddress}
                          onSave={handleAddressSave}
                          onCancel={() => setEditingAddress(false)}
                        />
                      ) : shippingAddress ? (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
                          <p className="text-gray-600">{shippingAddress.address}</p>
                          <p className="text-gray-600">{shippingAddress.city}, {shippingAddress.postalCode}</p>
                          {shippingAddress.phone && (
                            <p className="text-gray-600">Phone: {shippingAddress.phone}</p>
                          )}
                          {shippingAddress.email && (
                            <p className="text-gray-600">Email: {shippingAddress.email}</p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-500 text-sm italic">Shipping address information will be collected and displayed here in future updates.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono text-gray-900">{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking Number:</span>
                        <span className="font-mono text-gray-900">{order.trackingNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-mono text-gray-900">
                        {order.stripePaymentIntentId ? order.stripePaymentIntentId.slice(-8).toUpperCase() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="text-gray-900">
                        {formatDate(order.createdAt.toString())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-gray-900">
                        {formatDate(order.updatedAt.toString())}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Update */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">
                    Update Order Status
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                    <p className="text-xs text-gray-500">
                      Current status: {order.status}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Information Form */}
              {showTrackingForm && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900">
                      Add Tracking Information
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleTrackingSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={trackingData.status}
                          onChange={(e) => setTrackingData({...trackingData, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message (Optional)
                        </label>
                        <textarea
                          value={trackingData.message}
                          onChange={(e) => setTrackingData({...trackingData, message: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter tracking message..."
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button type="submit" className="flex-1">
                          Add Tracking Info
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowTrackingForm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  className="w-full flex items-center justify-center space-x-2"
                  onClick={() => setShowTrackingForm(true)}
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Add Tracking Information</span>
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Download Invoice</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}