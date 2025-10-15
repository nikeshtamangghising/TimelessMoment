'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon,
  // FunnelIcon, // Reserved for future filtering feature
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Loading from '@/components/ui/loading'
import { OrderWithItems, PaginatedResponse, OrderStatus } from '@/types'
import { formatPrice } from '@/lib/cart-utils'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<PaginatedResponse<OrderWithItems> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchQuery, statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/orders?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOrders()
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Refresh orders list
      fetchOrders()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order'
      alert(errorMessage)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: OrderStatus) => {
    if (selectedOrders.length === 0) {
      alert('Please select orders to update')
      return
    }

    if (!window.confirm(`Are you sure you want to update ${selectedOrders.length} orders to ${newStatus}?`)) {
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulkUpdateStatus',
          orderIds: selectedOrders,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update orders')
      }

      setSelectedOrders([])
      fetchOrders()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update orders'
      alert(errorMessage)
    }
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleSelectAll = () => {
    if (!orders) return
    
    if (selectedOrders.length === orders.data.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.data.map(order => order.id))
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'PROCESSING':
        return <CheckIcon className="h-4 w-4 text-blue-500" />
      case 'SHIPPED':
        return <TruckIcon className="h-4 w-4 text-purple-500" />
      case 'DELIVERED':
        return <TruckIcon className="h-4 w-4 text-green-500" />
      case 'CANCELLED':
        return <XMarkIcon className="h-4 w-4 text-red-500" />
      case 'REFUNDED':
        return <XMarkIcon className="h-4 w-4 text-orange-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: OrderStatus) => {
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
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage customer orders and fulfillment</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      placeholder="Search by order ID, customer name, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="flex items-center space-x-2">
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    <span>Search</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('')
                      setCurrentPage(1)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedOrders.length} orders selected
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('PROCESSING')}
                    >
                      Mark as Processing
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('SHIPPED')}
                    >
                      Mark as Shipped
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('DELIVERED')}
                    >
                      Mark as Delivered
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrders([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {orders ? `${orders.pagination.total} Orders` : 'Orders'}
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loading size="lg" />
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchOrders}>Try Again</Button>
                </div>
              ) : orders && orders.data.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={orders.data.length > 0 && selectedOrders.length === orders.data.length}
                              onChange={handleSelectAll}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.data.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order.id)}
                                onChange={() => handleSelectOrder(order.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  #{order.id.slice(-8).toUpperCase()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(order.createdAt.toString())}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {order.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.user.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatPrice(order.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(order.status)}
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                                  className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(order.status)}`}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                  <option value="REFUNDED">Refunded</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/admin/orders/${order.id}`}>
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {orders.pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-6">
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
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No orders found
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Orders will appear here when customers make purchases.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}