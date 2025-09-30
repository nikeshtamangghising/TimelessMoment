'use client'

import { useEffect, useState } from 'react'
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Loading from '@/components/ui/loading'
import { formatPrice } from '@/lib/cart-utils'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  productsChange: number
}

interface RecentOrder {
  id: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch dashboard statistics
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/orders?limit=5')
      ])

      if (!statsResponse.ok || !ordersResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [statsData, ordersData] = await Promise.all([
        statsResponse.json(),
        ordersResponse.json()
      ])

      setStats(statsData)
      setRecentOrders(ordersData.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(errorMessage)
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex justify-center items-center py-16">
            <Loading size="lg" />
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  if (error) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Revenue */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatPrice(stats.totalRevenue)}
                      </p>
                      <div className="flex items-center mt-1">
                        {stats.revenueChange >= 0 ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ml-1 ${
                          stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(stats.revenueChange)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Orders */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Total Orders</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.totalOrders.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-1">
                        {stats.ordersChange >= 0 ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ml-1 ${
                          stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(stats.ordersChange)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Customers */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UsersIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Total Customers</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.totalCustomers.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-1">
                        {stats.customersChange >= 0 ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ml-1 ${
                          stats.customersChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(stats.customersChange)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Products */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CubeIcon className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-500">Total Products</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {stats.totalProducts.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-1">
                        {stats.productsChange >= 0 ? (
                          <ArrowUpIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ml-1 ${
                          stats.productsChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(stats.productsChange)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
                <a
                  href="/admin/orders"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all orders →
                </a>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.customerName} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent orders</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <CubeIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add Product</h3>
                <p className="text-gray-500">Add a new product to your inventory</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <ShoppingBagIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Orders</h3>
                <p className="text-gray-500">View and update order statuses</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <UsersIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">View Customers</h3>
                <p className="text-gray-500">Manage customer accounts and data</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}