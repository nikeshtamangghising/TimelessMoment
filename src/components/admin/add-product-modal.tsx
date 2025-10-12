'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createProductSchema } from '@/lib/validations'
import Button from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface AddProductModalProps {
  onClose: () => void
  onSuccess: () => void
}

type CreateProductInput = z.infer<typeof createProductSchema>

export default function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      isNewArrival: false,
      images: [],
      tags: [],
      currency: 'NPR',
      inventory: 0,
      lowStockThreshold: 5,
    },
  })

  useEffect(() => {
    // In a real app, you'd fetch these from your API
    setCategories([
      { id: 'clx1e50gt000008l5he1a4s7j', name: 'Electronics' },
      { id: 'clx1e50gv000108l5872a2p5g', name: 'Books' },
    ])
    setBrands([
      { id: 'clx1e50h1000208l5c8sge278', name: 'Sony' },
      { id: 'clx1e50h6000308l505z21a5g', name: 'Penguin Books' },
    ])
  }, [])

  const name = watch('name')
  useEffect(() => {
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50)
      setValue('slug', slug)
    }
  }, [name, setValue])

  const onSubmit = async (data: CreateProductInput) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add New Product</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          {error && <div className="text-red-500 bg-red-100 p-3 rounded">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register('slug')} />
              {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="purchasePrice">Purchase Price (Cost)</Label>
              <Input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice', { valueAsNumber: true })} />
              {errors.purchasePrice && <p className="text-red-500 text-sm mt-1">{errors.purchasePrice.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="inventory">Inventory</Label>
              <Input id="inventory" type="number" {...register('inventory', { valueAsNumber: true })} />
              {errors.inventory && <p className="text-red-500 text-sm mt-1">{errors.inventory.message}</p>}
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register('sku')} />
              {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select id="categoryId" {...register('categoryId')} className="w-full p-2 border rounded-md">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <Label htmlFor="brandId">Brand</Label>
              <select id="brandId" {...register('brandId')} className="w-full p-2 border rounded-md">
                <option value="">Select a brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.brandId && <p className="text-red-500 text-sm mt-1">{errors.brandId.message}</p>}
            </div>
          </div>

          <div>
            <Label>Image URL</Label>
            <Input {...register('images.0')} placeholder="https://example.com/image.jpg" />
            {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch id="isActive" {...register('isActive')} defaultChecked={true} />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isFeatured" {...register('isFeatured')} />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isNewArrival" {...register('isNewArrival')} />
              <Label htmlFor="isNewArrival">New Arrival</Label>
            </div>
          </div>

        </form>
        <div className="flex justify-end p-4 border-t space-x-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </div>
    </div>
  )
}
