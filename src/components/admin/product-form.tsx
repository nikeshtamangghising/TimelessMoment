'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import ImageUpload from '@/components/ui/image-upload'
import { Product } from '@/types'

interface ProductFormProps {
  product?: Product
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
}

export default function ProductForm({ product, onSubmit, loading }: ProductFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    category: product?.category || '',
    slug: product?.slug || '',
    inventory: product?.inventory?.toString() || '',
    lowStockThreshold: product?.lowStockThreshold?.toString() || '5',
    images: product?.images || [],
    isActive: product?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !product) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, product])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }))
    // Clear error when images are updated
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    if (!formData.inventory || parseInt(formData.inventory) < 0) {
      newErrors.inventory = 'Valid inventory count is required'
    }

    if (!formData.lowStockThreshold || parseInt(formData.lowStockThreshold) < 0) {
      newErrors.lowStockThreshold = 'Valid low stock threshold is required'
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one product image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      inventory: parseInt(formData.inventory),
      lowStockThreshold: parseInt(formData.lowStockThreshold),
    }

    try {
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                error={errors.price}
                required
              />

              <Input
                label="Inventory"
                type="number"
                min="0"
                value={formData.inventory}
                onChange={(e) => handleInputChange('inventory', e.target.value)}
                error={errors.inventory}
                required
              />
            </div>

            <Input
              label="Low Stock Threshold"
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
              error={errors.lowStockThreshold}
              helperText="Alert when inventory drops below this number"
            />

            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              error={errors.category}
              placeholder="e.g., Electronics, Clothing, Books"
              required
            />

            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              error={errors.slug}
              helperText="URL-friendly version of the product name"
              required
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Product is active and visible to customers
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
            <p className="text-sm text-gray-500">Upload images or add URLs. First image will be used as primary.</p>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={formData.images}
              onImagesChange={handleImagesChange}
              maxImages={5}
              maxFileSize={5}
              error={errors.images}
            />
          </CardContent>
        </Card>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}