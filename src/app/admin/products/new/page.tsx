'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import ProductForm from '@/components/admin/product-form'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const result = await response.json()
      
      // Redirect to products list with success message
      router.push('/admin/products?created=true')
    } catch (error) {
      console.error('Error creating product:', error)
      alert(error instanceof Error ? error.message : 'Failed to create product')
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
            <Link 
              href="/admin/products" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600">Create a new product for your store</p>
          </div>

          {/* Product Form */}
          <ProductForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}