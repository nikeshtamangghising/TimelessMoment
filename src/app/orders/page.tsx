'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline'
import MainLayout from '@/components/layout/main-layout'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { OrderWithItems, PaginatedResponse } from '@/types'
import { formatPrice } from '@/lib/cart-utils'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<PaginatedResponse<OrderWithItems> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchOrders()
  }, [currentPage])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/orders?page=${currentPage}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders'
      setError(errorMessage)
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'PROCESSING':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />
      case 'SHIPPED':
        return <TruckIcon className="h-5 w-5 text-purple-500" />
      case 'DELIVERED':
        return <TruckIcon className="h-5 w-5 text-green-500" />
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'REFUNDED':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <MainLayout>
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-2 text-gray-600">
              Track and manage your order history
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loading size="lg" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Orders</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={fetchOrders}>Try Again</Button>
              </CardContent>
            </Card>
          ) : orders && orders.data.length > 0 ? (
            <>
              {/* Orders List */}
              <div className="space-y-6">
                {orders.data.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              Order #{order.id.slice(-8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Placed on {formatDate(order.createdAt.toString())}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {item.quantity}x
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatPrice(item.price)} each
                              </p>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-500 text-center">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </div>
                        <div className="flex space-x-3">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          {order.status === 'DELIVERED' && (
                            <Button size="sm">
                              Reorder
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {orders.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: orders.pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === orders.pagination.totalPages || 
                        Math.abs(page - currentPage) <= 2
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'primary' : 'outline'}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                    
                    <Button
                      variant="outline"
                      disabled={currentPage === orders.pagination.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-2xl font-medium text-gray-900 mb-2">
                  No orders yet
                </h2>
                <p className="text-gray-500 mb-6">
                  You haven't placed any orders yet. Start shopping to see your orders here!
                </p>
                <Link href="/products">
                  <Button size="lg">
                    Start Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </ProtectedRoute>
    </MainLayout>
  )
}