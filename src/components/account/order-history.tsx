'use client'

import { useState, useEffect } from 'react'
import { OrderWithItems } from '@/types'
import Button from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [page])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders?page=${page}&limit=5`)
      const data = await response.json()

      if (response.ok) {
        if (page === 1) {
          setOrders(data.data || [])
        } else {
          setOrders(prev => [...prev, ...(data.data || [])])
        }
        setHasMore(data.pagination && data.pagination.page < data.pagination.totalPages)
      } else {
        setError(data.error || 'Failed to fetch orders')
      }
    } catch (error) {
      setError('Failed to fetch orders')
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchOrders}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-4">
            You haven't placed any orders yet.
          </p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Order #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Tracking Number:</strong> {order.trackingNumber}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              Quantity: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.quantity * item.price)}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-600">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {order.status === 'DELIVERED' && (
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <Button
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load More Orders'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Order Management Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Order Management</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Track your orders with tracking numbers once shipped</li>
          <li>• View detailed order information including items and totals</li>
          <li>• Reorder items from previous orders easily</li>
          <li>• Contact support if you need help with any order</li>
        </ul>
      </div>
    </div>
  )
}
