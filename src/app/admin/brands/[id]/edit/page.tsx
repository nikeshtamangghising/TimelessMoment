'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import BrandForm from '@/components/admin/brand-form'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import { Brand } from '@/types'

export default function EditBrandPage() {
  const router = useRouter()
  const params = useParams()
  const brandId = params.id as string
  
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBrand = useCallback(async () => {
    setFetchLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/brands/${brandId}`)
      
      if (response.ok) {
        const brandData = await response.json()
        setBrand(brandData)
      } else if (response.status === 404) {
        setError('Brand not found')
      } else {
        setError('Failed to load brand')
      }
    } catch (error) {
      console.error('Error fetching brand:', error)
      setError('Failed to load brand')
    } finally {
      setFetchLoading(false)
    }
  }, [brandId])

  useEffect(() => {
    if (brandId) {
      fetchBrand()
    }
  }, [fetchBrand])

  const handleSubmit = async (formData: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/brands')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update brand')
      }
    } catch (error) {
      console.error('Error updating brand:', error)
      setError('Failed to update brand')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  if (error && !brand) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Brand</h1>
              <p className="text-gray-600">Update brand information</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-600">{error}</div>
              <button
                onClick={fetchBrand}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  if (!brand) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Brand</h1>
              <p className="text-gray-600">Brand not found</p>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Brand</h1>
        <p className="text-gray-600">Update &quot;{brand.name}&quot; information</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Form */}
      <BrandForm
        brand={brand}
        onSubmit={handleSubmit}
        loading={loading}
      />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}
