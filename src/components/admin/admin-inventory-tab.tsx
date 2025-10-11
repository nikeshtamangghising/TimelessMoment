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
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { formatPrice } from '@/lib/cart-utils'
import BulkInventoryUpdate from '@/components/admin/bulk-inventory-update'
import InventoryAdjustmentForm from '@/components/admin/inventory-adjustment-form'
import InventoryHistoryModal from '@/components/admin/inventory-history-modal'

type InventorySummary = {
  totalProducts: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  totalValue: number
  recentAdjustments: InventoryAdjustmentWithProduct[]
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

export default function AdminInventoryTab() {
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Monitor and manage your product inventory</p>
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
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Low Stock</p>
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
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {summary.outOfStockProducts.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CubeIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Units</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {summary.totalValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">
                  Low Stock Alert ({summary.lowStockProducts.length})
                </h3>
              </CardHeader>
              <CardContent>
                {summary.lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {summary.lowStockProducts.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded-md bg-yellow-50">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <Image
                              src={product.images[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {product.inventory} / Threshold: {product.lowStockThreshold}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustInventory(product)}
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShowHistory(product)}
                          >
                            <ClockIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {summary.lowStockProducts.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{summary.lowStockProducts.length - 5} more products
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No low stock items</p>
                )}
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
                        <Button
                          size="sm"
                          onClick={() => handleAdjustInventory(product)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Restock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

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
    </div>
  )
}