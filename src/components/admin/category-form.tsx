'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Category } from '@/types'

interface CategoryFormProps {
  category?: Category
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
}

export default function CategoryForm({ category, onSubmit, loading }: CategoryFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    metaTitle: category?.metaTitle || '',
    metaDescription: category?.metaDescription || '',
    parentId: category?.parentId || '',
    isActive: category?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          // Handle both array and object with categories property
          const allCategories = Array.isArray(data) ? data : (data.categories || [])
          // Filter out current category to prevent self-parenting
          const filteredCategories = category 
            ? allCategories.filter((cat: Category) => cat.id !== category.id)
            : allCategories
          setCategories(filteredCategories)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [category])

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !category) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, category])

  // Auto-generate meta title from name if not set
  useEffect(() => {
    if (formData.name && !formData.metaTitle && !category) {
      setFormData(prev => ({ ...prev, metaTitle: formData.name }))
    }
  }, [formData.name, formData.metaTitle, category])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    // Check for circular reference if parent is selected
    if (formData.parentId && category) {
      const wouldCreateCircle = (parentId: string): boolean => {
        const parent = categories.find(cat => cat.id === parentId)
        if (!parent) return false
        if (parent.id === category.id) return true
        return parent.parentId ? wouldCreateCircle(parent.parentId) : false
      }

      if (wouldCreateCircle(formData.parentId)) {
        newErrors.parentId = 'Cannot create circular reference'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Clean up the data before submission
      const submitData = {
        ...formData,
        parentId: formData.parentId || null,
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Get category options for parent selection
  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: `${(cat as any).parent ? (cat as any).parent.name + ' > ' : ''}${cat.name}`
  }))

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
              label="Category Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Enter category name..."
              required
            />

            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              error={errors.slug}
              helperText="URL-friendly version of the category name"
              placeholder="category-slug"
              required
            />

            <Select
              label="Parent Category"
              value={formData.parentId}
              onChange={(e) => handleInputChange('parentId', e.target.value)}
              options={[
                { value: '', label: 'None (Top Level)' },
                ...categoryOptions
              ]}
              error={errors.parentId}
              helperText="Select a parent category to create a subcategory"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter category description..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Category is active and visible
              </label>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Meta Title"
              value={formData.metaTitle}
              onChange={(e) => handleInputChange('metaTitle', e.target.value)}
              placeholder="SEO title for search engines"
              helperText="Recommended: 50-60 characters"
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
                placeholder="SEO description for search engines..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 150-160 characters ({formData.metaDescription.length}/160)
              </p>
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
          {category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  )
}