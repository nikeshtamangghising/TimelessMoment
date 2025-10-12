'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CubeIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  PlusIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  TagIcon,
  TrophyIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { formatPrice } from '@/lib/cart-utils'
import BulkInventoryUpdate from '@/components/admin/bulk-inventory-update'
import InventoryAdjustmentForm from '@/components/admin/inventory-adjustment-form'
import InventoryHistoryModal from '@/components/admin/inventory-history-modal'
import PurchaseHistoryModal from '@/components/admin/purchase-history-modal'
import CategoryInventoryDetails from '@/components/admin/category-inventory-details'
import InventoryForecastModal from '@/components/admin/inventory-forecast-modal'

type InventorySummary = {
  totalProducts: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  totalValue: number
  totalInventoryWorth: number
  recentAdjustments: InventoryAdjustmentWithProduct[]
  recentPurchases: PurchaseHistory[]
  totalProductsValue: number
  outOfStockCount: number
  lowStockCount: number
  inventoryTurnover: number
  categoryDistribution: Record<string, { count: number; value: number; items: any[] }>
  topSellingProducts: TopSellingProduct[]
}

type Product = {
  id: string
  name: string
  slug: string
  inventory: number
  lowStockThreshold: number
  price: number
  category: string
  isActive: boolean
  images: string[]
  sku?: string
  description?: string
}

type InventoryAdjustmentWithProduct = {
  id: string
  productId: string
  quantity: number
  type: string
  reason: string
  createdBy?: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
  }
}

type PurchaseHistory = {
  id: string
  productId: string
  quantity: number
  totalValue: number
  buyerName: string
  buyerEmail: string
  createdAt: string
  product: {
    id: string
    name: string
    price: number
  }
}

type TopSellingProduct = {
  productId: string
  name: string
  totalQuantity: number
  totalValue: number
  purchaseCount: number
}

type CategoryInventoryItem = {
  id: string
  name: string
  inventory: number
  price: number
  value: number
}

export default function InventoryPage() {
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPurchaseHistoryModal, setShowPurchaseHistoryModal] = useState(false)
  const [showCategoryDetails, setShowCategoryDetails] = useState(false)
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; items: CategoryInventoryItem[] } | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [forecastProduct, setForecastProduct] = useState<{ 
    name: string; 
    inventory: number; 
    avgDailySales: number; 
    avgSalePrice: number 
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'lowStock' | 'analytics' | 'categories' | 'topProducts'>('overview')

  useEffect(() => {
    fetchInventorySummary()
  }, [])

  const fetchInventorySummary = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/inventory')
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory summary')
      }

      const data = await response.json()
      setSummary(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory'
      setError(errorMessage)
      console.error('Error fetching inventory summary:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustInventory = (product: Product) => {
    setSelectedProduct(product)
    setShowAdjustmentForm(true)
  }

  const handleShowHistory = (product: Product) => {
    setSelectedProduct(product)
    setShowHistoryModal(true)
  }

  const handleShowPurchaseHistory = (product: Product) => {
    setSelectedProduct(product)
    setShowPurchaseHistoryModal(true)
  }

  const handleShowCategoryDetails = (category: string, items: CategoryInventoryItem[]) => {
    setSelectedCategory({ name: category, items })
    setShowCategoryDetails(true)
  }

  const handleShowForecast = (product: Product) => {
    // Calculate average daily sales (simplified for demo)
    const avgDailySales = Math.max(0.1, product.inventory / 30) // Assume inventory lasts 30 days
    const avgSalePrice = product.price
    
    setForecastProduct({
      name: product.name,
      inventory: product.inventory,
      avgDailySales,
      avgSalePrice
    })
    setShowForecastModal(true)
  }

  const handleRefresh = () => {
    fetchInventorySummary()
  }

  const formatAdjustmentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getAdjustmentColor = (type: string) => {
    switch (type) {
      case 'RESTOCK':
        return 'text-green-600'
      case 'ORDER_PLACED':
        return 'text-blue-600'
      case 'DAMAGED':
        return 'text-red-600'
      case 'ORDER_RETURNED':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const calculateTotalInventoryWorth = () => {
    if (!summary) return 0
    // This would be calculated on the backend in a real implementation
    return summary.totalValue * 25 // Placeholder calculation
  }

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Inventory Management</h1>
              <p className="text-gray-600">Monitor and manage your product inventory with detailed analytics</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center space-x-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={() => setShowBulkUpdate(true)}
                className="flex items-center space-x-2"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Bulk Update</span>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`${
                  activeTab === 'categories'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                By Category
              </button>
              <button
                onClick={() => setActiveTab('topProducts')}
                className={`${
                  activeTab === 'topProducts'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Top Products
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`${
                  activeTab === 'purchases'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Recent Purchases
              </button>
              <button
                onClick={() => setActiveTab('lowStock')}
                className={`${
                  activeTab === 'lowStock'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Low Stock Items
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loading size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchInventorySummary}>Try Again</Button>
            </div>
          ) : summary ? (
            <>
              {activeTab === 'overview' && (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CubeIcon className="h-8 w-8 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Products</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {summary.totalProducts}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Inventory Worth</p>
                            <p className="text-2xl font-semibold text-green-600">
                              {formatPrice(summary.totalInventoryWorth || calculateTotalInventoryWorth())}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                            <p className="text-2xl font-semibold text-yellow-600">
                              {summary.lowStockProducts.length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Recent Purchases</p>
                            <p className="text-2xl font-semibold text-blue-600">
                              {summary.recentPurchases?.length || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Inventory Value Chart */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-medium text-gray-900">
                          Inventory Overview
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Total Units in Stock</span>
                              <span>{summary.totalValue.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: '75%' }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Out of Stock Items</span>
                              <span>{summary.outOfStockProducts.length}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-600 h-2 rounded-full" 
                                style={{ width: `${(summary.outOfStockProducts.length / summary.totalProducts) * 100 || 5}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Low Stock Items</span>
                              <span>{summary.lowStockProducts.length}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${(summary.lowStockProducts.length / summary.totalProducts) * 100 || 10}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Adjustments */}
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-medium text-gray-900">
                          Recent Adjustments
                        </h3>
                      </CardHeader>
                      <CardContent>
                        {summary.recentAdjustments.length > 0 ? (
                          <div className="space-y-3">
                            {summary.recentAdjustments.map((adjustment) => (
                              <div key={adjustment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {adjustment.product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatAdjustmentType(adjustment.type)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-medium ${
                                    adjustment.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(adjustment.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">No recent adjustments</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Out of Stock Products */}
                  {summary.outOfStockProducts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-medium text-gray-900">
                          Out of Stock Products ({summary.outOfStockProducts.length})
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {summary.outOfStockProducts.map((product) => (
                            <div key={product.id} className="p-4 border border-red-200 rounded-md bg-red-50">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <Image
                                    src={product.images[0] || '/placeholder-product.jpg'}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{product.category}</p>
                                  <p className="text-xs text-red-600 font-medium">Out of Stock</p>
                                </div>
                                <div className="flex flex-col space-y-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAdjustInventory(product)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Restock
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleShowPurchaseHistory(product)}
                                  >
                                    Purchases
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {activeTab === 'analytics' && (
                <>
                  {/* Analytics Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Inventory Value</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {formatCurrency(summary.totalProductsValue)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Inventory Turnover</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {summary.inventoryTurnover.toFixed(2)}x
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                            <p className="text-2xl font-semibold text-red-600">
                              {summary.outOfStockCount}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Low Stock</p>
                            <p className="text-2xl font-semibold text-yellow-600">
                              {summary.lowStockCount}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Inventory Distribution Chart */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-medium text-gray-900">
                        Inventory Distribution by Value
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(summary.categoryDistribution)
                          .sort((a, b) => b[1].value - a[1].value)
                          .map(([category, data]) => (
                          <div key={category}>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span className="font-medium">{category}</span>
                              <span>{formatCurrency(data.value)} ({data.count} items)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-indigo-600 h-3 rounded-full" 
                                style={{ 
                                  width: `${(data.value / summary.totalProductsValue) * 100 || 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'categories' && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">
                      Inventory by Category
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(summary.categoryDistribution).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Products
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Inventory Value
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Avg. Price
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(summary.categoryDistribution)
                              .sort((a, b) => b[1].value - a[1].value)
                              .map(([category, data]) => (
                              <tr key={category}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{category}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {data.count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(data.value)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {data.count > 0 ? formatCurrency(data.value / data.count) : '$0.00'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleShowCategoryDetails(category, data.items)}
                                  >
                                    View Details
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No category data available</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'topProducts' && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">
                      Top Selling Products
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {summary.topSellingProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Units Sold
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sales Value
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Orders
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {summary.topSellingProducts.map((product, index) => (
                              <tr key={product.productId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      {index < 3 && (
                                        <TrophyIcon className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.totalQuantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatCurrency(product.totalValue)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.purchaseCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // Find the full product object to get inventory info
                                      const fullProduct = summary.lowStockProducts.find(p => p.id === product.productId) || 
                                        summary.outOfStockProducts.find(p => p.id === product.productId)
                                      if (fullProduct) {
                                        handleShowForecast(fullProduct)
                                      }
                                    }}
                                  >
                                    <LightBulbIcon className="h-4 w-4 mr-1" />
                                    Forecast
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No sales data available</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'purchases' && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">
                      Recent Purchases
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {summary.recentPurchases && summary.recentPurchases.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Buyer
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Value
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {summary.recentPurchases.map((purchase) => (
                              <tr key={purchase.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{purchase.product.name}</div>
                                      <div className="text-sm text-gray-500">ID: {purchase.productId.substring(0, 8)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{purchase.buyerName}</div>
                                  <div className="text-sm text-gray-500">{purchase.buyerEmail}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {purchase.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatPrice(purchase.totalValue)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(purchase.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No recent purchases</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'lowStock' && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium text-gray-900">
                      Low Stock Alert ({summary.lowStockProducts.length})
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {summary.lowStockProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Current Stock
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Threshold
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {summary.lowStockProducts.map((product) => (
                              <tr key={product.id} className="bg-yellow-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-sm text-gray-500">{product.sku || 'N/A'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.category}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {product.inventory}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.lowStockThreshold}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAdjustInventory(product)}
                                    className="mr-2"
                                  >
                                    <PlusIcon className="h-3 w-3 mr-1" />
                                    Restock
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleShowHistory(product)}
                                    className="mr-2"
                                  >
                                    <ClockIcon className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleShowPurchaseHistory(product)}
                                    className="mr-2"
                                  >
                                    <ShoppingCartIcon className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleShowForecast(product)}
                                  >
                                    <LightBulbIcon className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No low stock items</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>

        {/* Modals */}
        {showBulkUpdate && (
          <BulkInventoryUpdate
            onClose={() => setShowBulkUpdate(false)}
            onSuccess={() => {
              setShowBulkUpdate(false)
              fetchInventorySummary()
            }}
          />
        )}

        {showAdjustmentForm && selectedProduct && (
          <InventoryAdjustmentForm
            product={selectedProduct}
            onClose={() => {
              setShowAdjustmentForm(false)
              setSelectedProduct(null)
            }}
            onSuccess={() => {
              setShowAdjustmentForm(false)
              setSelectedProduct(null)
              fetchInventorySummary()
            }}
          />
        )}

        {showHistoryModal && selectedProduct && (
          <InventoryHistoryModal
            product={selectedProduct}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedProduct(null)
            }}
          />
        )}

        {showPurchaseHistoryModal && selectedProduct && (
          <PurchaseHistoryModal
            product={selectedProduct}
            onClose={() => {
              setShowPurchaseHistoryModal(false)
              setSelectedProduct(null)
            }}
          />
        )}

        {showCategoryDetails && selectedCategory && (
          <CategoryInventoryDetails
            category={selectedCategory.name}
            items={selectedCategory.items}
            onClose={() => {
              setShowCategoryDetails(false)
              setSelectedCategory(null)
            }}
          />
        )}

        {showForecastModal && forecastProduct && (
          <InventoryForecastModal
            productName={forecastProduct.name}
            currentInventory={forecastProduct.inventory}
            averageDailySales={forecastProduct.avgDailySales}
            averageSalePrice={forecastProduct.avgSalePrice}
            onClose={() => {
              setShowForecastModal(false)
              setForecastProduct(null)
            }}
          />
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  )
}