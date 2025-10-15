'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { formatPrice } from '@/lib/cart-utils'

type Product = {
  id: string
  name: string
  inventory: number
  price: number
  lowStockThreshold: number
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

type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface PurchaseHistoryModalProps {
  product: Product
  onClose: () => void
}

export default function PurchaseHistoryModal({ product, onClose }: PurchaseHistoryModalProps) {
  const [history, setHistory] = useState<PaginatedResponse<PurchaseHistory> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchPurchaseHistory(currentPage)
  }, [currentPage])

  const fetchPurchaseHistory = async (page: number) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        productId: product.id,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/inventory/purchases?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase history')
      }

      const data = await response.json()
      setHistory(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load purchase history'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Purchase History
              </h3>
              <p className="text-sm text-gray-500 mt-1">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Stock:</span>
                <span className="ml-2 font-medium text-lg">{product.inventory}</span>
              </div>
              <div>
                <span className="text-gray-500">Price:</span>
                <span className="ml-2 font-medium">{formatPrice(product.price)}</span>
              </div>
              <div>
                <span className="text-gray-500">Low Stock Threshold:</span>
                <span className="ml-2 font-medium">{product.lowStockThreshold}</span>
              </div>
            </div>
          </div>

          {/* Purchase History List */}
          <div className="mb-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="md" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => fetchPurchaseHistory(currentPage)}>Try Again</Button>
              </div>
            ) : history && history.data.length > 0 ? (
              <div className="space-y-3">
                {history.data.map((purchase) => (
                  <div key={purchase.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <ShoppingBagIcon className="h-3 w-3 mr-1" />
                            Purchase
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {purchase.quantity} unit{purchase.quantity > 1 ? 's' : ''}
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            {formatPrice(purchase.totalValue)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-medium">Buyer:</span> {purchase.buyerName}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          {purchase.buyerEmail}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>
                            {new Date(purchase.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {history.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: Math.min(5, history.pagination.totalPages) }, (_, i) => {
                        let page
                        if (history.pagination.totalPages <= 5) {
                          page = i + 1
                        } else if (currentPage <= 3) {
                          page = i + 1
                        } else if (currentPage >= history.pagination.totalPages - 2) {
                          page = history.pagination.totalPages - 4 + i
                        } else {
                          page = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === history.pagination.totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Purchase History Found
                </h3>
                <p className="text-gray-500">
                  No purchases have been made for this product yet.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}