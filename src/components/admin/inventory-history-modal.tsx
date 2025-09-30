'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'

type Product = {
  id: string
  name: string
  inventory: number
  lowStockThreshold: number
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

type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface InventoryHistoryModalProps {
  product: Product
  onClose: () => void
}

export default function InventoryHistoryModal({ product, onClose }: InventoryHistoryModalProps) {
  const [history, setHistory] = useState<PaginatedResponse<InventoryAdjustmentWithProduct> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchHistory(currentPage)
  }, [currentPage])

  const fetchHistory = async (page: number) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        productId: product.id,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/inventory/history?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory history')
      }

      const data = await response.json()
      setHistory(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory history'
      setError(errorMessage)
      console.error('Error fetching inventory history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatAdjustmentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RESTOCK':
        return 'bg-green-100 text-green-800'
      case 'ORDER_PLACED':
        return 'bg-blue-100 text-blue-800'
      case 'DAMAGED':
        return 'bg-red-100 text-red-800'
      case 'ORDER_RETURNED':
        return 'bg-yellow-100 text-yellow-800'
      case 'MANUAL_ADJUSTMENT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
                Inventory History
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

          {/* Current Stock Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Stock:</span>
                <span className="ml-2 font-medium text-lg">{product.inventory}</span>
              </div>
              <div>
                <span className="text-gray-500">Low Stock Threshold:</span>
                <span className="ml-2 font-medium">{product.lowStockThreshold}</span>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="mb-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading size="md" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => fetchHistory(currentPage)}>Try Again</Button>
              </div>
            ) : history && history.data.length > 0 ? (
              <div className="space-y-3">
                {history.data.map((adjustment) => (
                  <div key={adjustment.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(adjustment.type)}`}>
                            {formatAdjustmentType(adjustment.type)}
                          </span>
                          <span className={`text-sm font-medium ${
                            adjustment.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">{adjustment.reason}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {new Date(adjustment.createdAt).toLocaleString()}
                          </span>
                          {adjustment.createdBy && (
                            <span>by {adjustment.createdBy}</span>
                          )}
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
                  <ClockIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No History Found
                </h3>
                <p className="text-gray-500">
                  No inventory adjustments have been made for this product yet.
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