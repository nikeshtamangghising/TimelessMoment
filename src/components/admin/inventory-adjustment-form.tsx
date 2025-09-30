'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

type Product = {
  id: string
  name: string
  inventory: number
  lowStockThreshold: number
}

interface InventoryAdjustmentFormProps {
  product: Product
  onClose: () => void
  onSuccess: () => void
}

const ADJUSTMENT_TYPES = [
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
  { value: 'RESTOCK', label: 'Restock' },
  { value: 'DAMAGED', label: 'Damaged/Lost' },
  { value: 'OTHER', label: 'Other' },
]

export default function InventoryAdjustmentForm({ product, onClose, onSuccess }: InventoryAdjustmentFormProps) {
  const [formData, setFormData] = useState({
    quantity: 0,
    type: 'MANUAL_ADJUSTMENT',
    reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.quantity === 0) {
      setError('Adjustment quantity cannot be zero')
      return
    }

    if (!formData.reason.trim()) {
      setError('Please provide a reason for the adjustment')
      return
    }

    // Calculate new inventory level
    const newInventory = product.inventory + formData.quantity
    if (newInventory < 0) {
      setError(`Cannot reduce inventory below zero. Current: ${product.inventory}, Adjustment: ${formData.quantity}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: formData.quantity,
          type: formData.type,
          reason: formData.reason.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to adjust inventory')
      }

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust inventory'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const newInventory = Math.max(0, product.inventory + formData.quantity)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Adjust Inventory
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current Stock:</span>
                <span className="ml-2 font-medium">{product.inventory}</span>
              </div>
              <div>
                <span className="text-gray-500">Low Stock Threshold:</span>
                <span className="ml-2 font-medium">{product.lowStockThreshold}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {ADJUSTMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Adjustment *
                </label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  placeholder="Enter adjustment (+/- number)"
                  helperText="Positive numbers increase inventory, negative numbers decrease it"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe the reason for this adjustment..."
                  required
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Preview</h5>
                <div className="text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Current Inventory:</span>
                    <span className="font-medium">{product.inventory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adjustment:</span>
                    <span className={`font-medium ${formData.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.quantity >= 0 ? '+' : ''}{formData.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                    <span>New Inventory:</span>
                    <span className="font-medium">{newInventory}</span>
                  </div>
                  {newInventory <= product.lowStockThreshold && newInventory > 0 && (
                    <p className="text-yellow-600 text-xs mt-1">⚠️ Will be below low stock threshold</p>
                  )}
                  {newInventory === 0 && (
                    <p className="text-red-600 text-xs mt-1">⚠️ Product will be out of stock</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
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
                disabled={loading || formData.quantity === 0}
              >
                Apply Adjustment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}