'use client'

import { useEffect, useState } from 'react'
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  UsersIcon, 
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Loading from '@/components/ui/loading'
import Button from '@/components/ui/button'
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
  ordersByStatus?: Array<{
    status: string
    count: number
  }>
  averageOrderValue?: number
}

interface LowStockProduct {
  id: string
  name: string
  inventory: number
  lowStockThreshold: number
}

interface PendingOrder {
  id: string
  customerName: string
  total: number
  status: string
  createdAt: string
  itemsCount: number
}

interface RecentOrder {
  id: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

interface AdminDashboardContentProps {
  onTabChange?: (tab: string) => void
}

export default function AdminDashboardContent({ onTabChange }: AdminDashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch dashboard statistics and additional data
      const [statsResponse, ordersResponse, lowStockResponse, pendingOrdersResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/orders?limit=5'),
        fetch('/api/inventory/low-stock'),
        fetch('/api/orders?status=PENDING&limit=5')
      ])

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const [statsData, ordersData, lowStockData, pendingOrdersData] = await Promise.all([
        statsResponse.json(),
        ordersResponse.ok ? ordersResponse.json() : { data: [] },
        lowStockResponse.ok ? lowStockResponse.json() : { data: [] },
        pendingOrdersResponse.ok ? pendingOrdersResponse.json() : { data: [] }
      ])

      setStats(statsData)
      setRecentOrders(ordersData.data || [])
      setLowStockProducts(lowStockData.data || [])
      setPendingOrders(pendingOrdersData.data || [])
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

  const handleQuickAction = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loading size="lg" />
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
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

      {/* Additional Insights */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Average Order Value */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Average Order Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatPrice(stats.averageOrderValue || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Per order</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {lowStockProducts.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Need attention</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pendingOrders.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
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
            <button 
              className="text-sm text-indigo-600 hover:text-indigo-500"
              onClick={() => handleQuickAction('orders')}
            >
              View all orders →
            </button>
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

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Low Stock Alert</h2>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {lowStockProducts.length} items
                </span>
                <button 
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                  onClick={() => handleQuickAction('inventory')}
                >
                  Manage →
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">Threshold: {product.lowStockThreshold}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">{product.inventory} left</p>
                    <p className="text-xs text-gray-500">Stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => handleQuickAction('products')}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <PlusIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Product</h3>
            <p className="text-gray-500 text-sm">Add a new product to your inventory</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => handleQuickAction('orders')}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <ShoppingBagIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Orders</h3>
            <p className="text-gray-500 text-sm">View and update order statuses</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => handleQuickAction('customers')}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">View Customers</h3>
            <p className="text-gray-500 text-sm">Manage customer accounts and data</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => handleQuickAction('analytics')}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">View Analytics</h3>
            <p className="text-gray-500 text-sm">Detailed insights and reports</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}