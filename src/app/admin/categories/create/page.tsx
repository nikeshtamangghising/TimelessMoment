'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CategoryForm from '@/components/admin/category-form'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'

export default function CreateCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/categories')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create category')
      }
    } catch (error) {
      setError('Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Category</h1>
        <p className="text-gray-600">Add a new category to your product catalog</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Form */}
      <CategoryForm
        onSubmit={handleSubmit}
        loading={loading}
      />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}
