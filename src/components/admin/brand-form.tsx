'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Brand } from '@/types'

interface BrandFormProps {
  brand?: Brand
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
}

export default function BrandForm({ brand, onSubmit, loading }: BrandFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    slug: brand?.slug || '',
    description: brand?.description || '',
    logo: brand?.logo || '',
    website: brand?.website || '',
    isActive: brand?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !brand) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.name, brand])

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
      newErrors.name = 'Brand name is required'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    // URL validation for website if provided
    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website)
      } catch {
        newErrors.website = 'Please enter a valid website URL'
      }
    }

    // URL validation for logo if provided
    if (formData.logo && formData.logo.trim()) {
      try {
        new URL(formData.logo)
      } catch {
        newErrors.logo = 'Please enter a valid logo URL'
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
      await onSubmit(formData)
    } catch (error) {
      // Handle form submission errors
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
              label="Brand Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Enter brand name..."
              required
            />

            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              error={errors.slug}
              helperText="URL-friendly version of the brand name"
              placeholder="brand-slug"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter brand description..."
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
                Brand is active and visible
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Assets & Links */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Assets & Links</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Logo URL"
              type="url"
              value={formData.logo}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              error={errors.logo}
              placeholder="https://example.com/logo.png"
              helperText="URL to the brand's logo image"
            />

            {formData.logo && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Preview
                </label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img
                    src={formData.logo}
                    alt="Logo preview"
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const errorText = target.nextSibling as HTMLElement
                      if (errorText) {
                        errorText.style.display = 'block'
                      }
                    }}
                  />
                  <div style={{ display: 'none' }} className="text-red-500 text-sm">
                    Failed to load image
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Website URL"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              error={errors.website}
              placeholder="https://brand-website.com"
              helperText="Official brand website"
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
          {brand ? 'Update Brand' : 'Create Brand'}
        </Button>
      </div>
    </form>
  )
}