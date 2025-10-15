'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Loading from '@/components/ui/loading'
import { Product } from '@/types'

type BulkUpdateItem = {
  productId: string
  quantity: number
  productName?: string
}

interface BulkInventoryUpdateProps {
  onClose: () => void
  onSuccess: () => void
}

export default function BulkInventoryUpdate({ onClose, onSuccess }: BulkInventoryUpdateProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [updates, setUpdates] = useState<BulkUpdateItem[]>([])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingProducts, setFetchingProducts] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data)
      }
    } catch (error) {
      setError('Failed to load products')
    } finally {
      setFetchingProducts(false)
    }
  }

  const addUpdateRow = () => {
    setUpdates([...updates, { productId: '', quantity: 0 }])
  }

  const removeUpdateRow = (index: number) => {
    setUpdates(updates.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof BulkUpdateItem, value: string | number) => {
    const newUpdates = [...updates]
    newUpdates[index] = { ...newUpdates[index], [field]: value }
    
    // Update product name when product is selected
    if (field === 'productId' && typeof value === 'string') {
      const product = products.find(p => p.id === value)
      newUpdates[index].productName = product?.name
    }
    
    setUpdates(newUpdates)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (updates.length === 0) {
      setError('Please add at least one product update')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the bulk update')
      return
    }

    const validUpdates = updates.filter(u => u.productId && u.quantity >= 0)
    if (validUpdates.length === 0) {
      setError('Please provide valid product and quantity for at least one row')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: validUpdates.map(u => ({ productId: u.productId, quantity: u.quantity })),
          reason: reason.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update inventory')
      }

      const result = await response.json()
      alert(`Successfully updated ${result.updatedCount} products`)
      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Bulk Inventory Update
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {fetchingProducts ? (
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Update *
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Monthly inventory recount, Bulk restock"
                  required
                />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Product Updates</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addUpdateRow}
                    className="flex items-center space-x-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Row</span>
                  </Button>
                </div>

                {updates.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
                    <p className="text-gray-500">No products added yet</p>
                    <p className="text-sm text-gray-400">Click "Add Row" to start adding products</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {updates.map((update, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                        <div className="flex-1">
                          <select
                            value={update.productId}
                            onChange={(e) => updateRow(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} (Current: {product.inventory})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            value={update.quantity}
                            onChange={(e) => updateRow(index, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder="New qty"
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUpdateRow(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || updates.length === 0}
                >
                  Update Inventory ({updates.filter(u => u.productId && u.quantity >= 0).length} items)
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}