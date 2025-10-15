'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BrandForm from '@/components/admin/brand-form'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'

export default function CreateBrandPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/admin/brands')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create brand')
      }
    } catch (error) {
      setError('Failed to create brand')
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
        <h1 className="text-2xl font-bold text-gray-900">Create New Brand</h1>
        <p className="text-gray-600">Add a new brand to your product catalog</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Form */}
      <BrandForm
        onSubmit={handleSubmit}
        loading={loading}
      />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}
