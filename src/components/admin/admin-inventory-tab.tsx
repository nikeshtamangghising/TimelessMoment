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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { formatPrice } from '@/lib/cart-utils'
import BulkInventoryUpdate from '@/components/admin/bulk-inventory-update'
import InventoryAdjustmentForm from '@/components/admin/inventory-adjustment-form'
import InventoryHistoryModal from '@/components/admin/inventory-history-modal'
import AddProductModal from '@/components/admin/add-product-modal'

type InventoryAnalytics = {
  totalProducts: number;
  totalInventoryValue: number;
  totalInventoryUnits: number;
  outOfStockProducts: number;
}

type Product = {
  id: string
  name: string
  slug: string
  inventory: number
  lowStockThreshold: number
  price: number;
  purchasePrice?: number | null;
  category: { name: string };
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
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [analyticsRes, lowStockRes, outOfStockRes] = await Promise.all([
        fetch('/api/inventory/analytics'),
        fetch('/api/products?lowStock=true&limit=10'),
        fetch('/api/products?outOfStock=true&limit=10'),
      ]);

      if (!analyticsRes.ok || !lowStockRes.ok || !outOfStockRes.ok) {
        throw new Error('Failed to fetch all inventory data');
      }

      const analyticsData = await analyticsRes.json();
      const lowStockData = await lowStockRes.json();
      const outOfStockData = await outOfStockRes.json();

      setAnalytics(analyticsData);
      setLowStockProducts(lowStockData.data);
      setOutOfStockProducts(outOfStockData.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory data'
      setError(errorMessage)
      console.error('Error fetching inventory data:', err)
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
    fetchData()
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
          <Button
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Product</span>
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
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      ) : analytics ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(analytics.totalInventoryValue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalInventoryUnits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{analytics.lowStockProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.outOfStockProducts}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">
                  Low Stock Alert ({lowStockProducts.length})
                </h3>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded-md bg-yellow-50">
                        <div className="flex items-center space-x-3">
                          <Image src={product.images[0] || '/placeholder-product.jpg'} alt={product.name} width={32} height={32} className="w-8 h-8 rounded object-cover" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">Stock: {product.inventory} / Threshold: {product.lowStockThreshold}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAdjustInventory(product)}><PlusIcon className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No low stock items</p>
                )}
              </CardContent>
            </Card>

            {/* Out of Stock Products */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">
                  Out of Stock ({analytics.outOfStockProducts})
                </h3>
              </CardHeader>
              <CardContent>
                {outOfStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {outOfStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border border-red-200 rounded-md bg-red-50">
                        <div className="flex items-center space-x-3">
                          <Image src={product.images[0] || '/placeholder-product.jpg'} alt={product.name} width={32} height={32} className="w-8 h-8 rounded object-cover" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-red-600 font-medium">Out of Stock</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleAdjustInventory(product)} className="bg-red-600 hover:bg-red-700">Restock</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No products are out of stock</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Modals */}
      {showBulkUpdate && (
        <BulkInventoryUpdate
          onClose={() => setShowBulkUpdate(false)}
          onSuccess={() => {
            setShowBulkUpdate(false)
            fetchData()
          }}
        />
      )}

      {showAddProductModal && (
        <AddProductModal
          onClose={() => setShowAddProductModal(false)}
          onSuccess={() => {
            setShowAddProductModal(false);
            fetchData();
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
            fetchData()
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