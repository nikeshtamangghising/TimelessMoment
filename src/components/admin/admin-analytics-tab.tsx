'use client'

import { useEffect, useState } from 'react'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  CubeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Loading from '@/components/ui/loading'
import { formatPrice } from '@/lib/cart-utils'

interface AnalyticsStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  productsChange: number
  averageOrderValue: number
  conversionRate: number
  topSellingProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  recentActivity: Array<{
    id: string
    type: 'order' | 'customer' | 'product'
    description: string
    timestamp: string
  }>
  salesData: Array<{
    period: string
    revenue: number
    orders: number
  }>
}

interface SalesData {
  period: string
  revenue: number
  orders: number
}

export default function AdminAnalyticsTab() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data: AnalyticsStats = await response.json()
      setStats(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: 'order' | 'customer' | 'product') => {
    switch (type) {
      case 'order':
        return <ShoppingBagIcon className="h-5 w-5 text-blue-500" />
      case 'customer':
        return <UsersIcon className="h-5 w-5 text-green-500" />
      case 'product':
        return <CubeIcon className="h-5 w-5 text-orange-500" />
    }
  }

  const getPercentageColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getPercentageIcon = (change: number) => {
    return change >= 0 ? (
      <ArrowUpIcon className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your store's performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loading size="lg" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      ) : stats ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                      {getPercentageIcon(stats.revenueChange)}
                      <span className={`text-sm ml-1 ${getPercentageColor(stats.revenueChange)}`}>
                        {Math.abs(stats.revenueChange)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      {getPercentageIcon(stats.ordersChange)}
                      <span className={`text-sm ml-1 ${getPercentageColor(stats.ordersChange)}`}>
                        {Math.abs(stats.ordersChange)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">Customers</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalCustomers.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      {getPercentageIcon(stats.customersChange)}
                      <span className={`text-sm ml-1 ${getPercentageColor(stats.customersChange)}`}>
                        {Math.abs(stats.customersChange)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatPrice(stats.averageOrderValue)}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">
                        {stats.conversionRate}% conversion
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Sales Overview</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.salesData.map((period, index) => (
                    <div key={period.period} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">{period.period}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{period.orders} orders</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(period.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Top Selling Products</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topSellingProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sales} sold</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(product.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <ChartBarIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatPrice(stats.averageOrderValue)}
                </h3>
                <p className="text-sm text-gray-500">Average Order Value</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <UsersIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</h3>
                <p className="text-sm text-gray-500">Conversion Rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <ShoppingBagIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {(stats.totalOrders / stats.totalCustomers).toFixed(1)}
                </h3>
                <p className="text-sm text-gray-500">Orders per Customer</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}