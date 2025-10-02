'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import ImageUpload from '@/components/ui/image-upload'
import { Product, Brand, Category } from '@/types'

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
    shortDescription: (product as any)?.shortDescription || '',
    price: product?.price?.toString() || '',
    discountPrice: (product as any)?.discountPrice?.toString() || '',
    currency: (product as any)?.currency || 'USD',
    categoryId: (product as any)?.categoryId || '',
    brandId: (product as any)?.brandId || '',
    slug: product?.slug || '',
    sku: (product as any)?.sku || '',
    weight: (product as any)?.weight?.toString() || '',
    dimensions: (product as any)?.dimensions || { length: '', width: '', height: '' },
    inventory: product?.inventory?.toString() || '',
    lowStockThreshold: product?.lowStockThreshold?.toString() || '5',
    metaTitle: (product as any)?.metaTitle || '',
    metaDescription: (product as any)?.metaDescription || '',
    tags: (product as any)?.tags?.join(', ') || '',
    images: product?.images || [],
    isActive: product?.isActive ?? true,
    isFeatured: (product as any)?.isFeatured ?? false,
    isNewArrival: (product as any)?.isNewArrival ?? false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Fetch categories and brands on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          fetch('/api/categories?type=flat'),
          fetch('/api/brands')
        ])
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }
        
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json()
          setBrands(brandsData.brands || [])
        }
      } catch (error) {
        console.error('Error fetching options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }
    
    fetchOptions()
  }, [])

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

  // Auto-generate SKU from name if not exists
  useEffect(() => {
    if (formData.name && !product && !formData.sku) {
      const sku = formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .substring(0, 10) + '-' + Date.now().toString().slice(-4)
      setFormData(prev => ({ ...prev, sku }))
    }
  }, [formData.name, product, formData.sku])

  const handleInputChange = (field: string, value: string | boolean | object) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDimensionChange = (dimension: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }))
    // Clear error when user starts typing
    if (errors.dimensions) {
      setErrors(prev => ({ ...prev, dimensions: '' }))
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

    if (!formData.categoryId.trim()) {
      newErrors.categoryId = 'Category is required'
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
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      dimensions: (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height) 
        ? formData.dimensions 
        : null,
      inventory: parseInt(formData.inventory),
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      brandId: formData.brandId || null,
    }

    try {
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
  ]

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name
  }))

  const brandOptions = [
    { value: '', label: 'No Brand' },
    ...brands.map(brand => ({
      value: brand.id,
      label: brand.name
    }))
  ]

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading form options...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                required
                className="md:col-span-2"
              />
              
              <Select
                label="Category"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                options={categoryOptions}
                error={errors.categoryId}
                placeholder="Select a category"
                required
              />

              <Select
                label="Brand"
                value={formData.brandId}
                onChange={(e) => handleInputChange('brandId', e.target.value)}
                options={brandOptions}
                error={errors.brandId}
                placeholder="Select a brand (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter detailed product description..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief description for product cards and listings..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                error={errors.price}
                required
              />

              <Input
                label="Discount Price"
                type="number"
                step="0.01"
                min="0"
                value={formData.discountPrice}
                onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                error={errors.discountPrice}
                helperText="Optional sale price"
              />

              <Select
                label="Currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                options={currencyOptions}
                error={errors.currency}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SKU"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                error={errors.sku}
                helperText="Stock Keeping Unit (auto-generated if empty)"
              />

              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                error={errors.slug}
                helperText="URL-friendly version (auto-generated if empty)"
                required
              />
            </div>

            <Input
              label="Tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              error={errors.tags}
              placeholder="tag1, tag2, tag3"
              helperText="Comma-separated tags for search and filtering"
            />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory & Shipping */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Inventory & Shipping</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Inventory"
                type="number"
                min="0"
                value={formData.inventory}
                onChange={(e) => handleInputChange('inventory', e.target.value)}
                error={errors.inventory}
                required
              />

              <Input
                label="Low Stock Threshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                error={errors.lowStockThreshold}
                helperText="Alert when inventory drops below this"
              />
            </div>

            <Input
              label="Weight (kg)"
              type="number"
              step="0.01"
              min="0"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              error={errors.weight}
              helperText="For shipping calculations"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions (cm)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Length"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.length}
                  onChange={(e) => handleDimensionChange('length', e.target.value)}
                />
                <Input
                  placeholder="Width"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                />
                <Input
                  placeholder="Height"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                />
              </div>
              {errors.dimensions && (
                <p className="mt-1 text-sm text-red-600">{errors.dimensions}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SEO & Status */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">SEO & Status</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Meta Title"
              value={formData.metaTitle}
              onChange={(e) => handleInputChange('metaTitle', e.target.value)}
              error={errors.metaTitle}
              helperText="SEO title for search engines"
              maxLength={60}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                rows={3}
                maxLength={160}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="SEO description for search engines (max 160 chars)..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>

            <div className="space-y-3">
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                  Featured product (appears in highlights)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNewArrival"
                  checked={formData.isNewArrival}
                  onChange={(e) => handleInputChange('isNewArrival', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isNewArrival" className="ml-2 block text-sm text-gray-900">
                  New arrival (shows "New" badge)
                </label>
              </div>
            </div>
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