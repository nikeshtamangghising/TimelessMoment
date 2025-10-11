'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import ProductForm from '@/components/admin/product-form'
import Loading from '@/components/ui/loading'
import { Product } from '@/types'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string>('')
  const [productId, setProductId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setProductId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/products/${productId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found')
        }
        throw new Error('Failed to fetch product')
      }

      const productData = await response.json()
      setProduct(productData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product'
      setError(errorMessage)
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    setUpdating(true)

    try {
      console.log('Submitting product update for ID:', productId)
      console.log('Data to submit:', data)
      
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      const result = await response.json()
      console.log('Product update result:', result)
      
      // Redirect to products list with success message
      router.push('/admin/products?updated=true')
    } catch (error) {
      console.error('Error updating product:', error)
      // Show a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product'
      alert(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loading size="lg" />
              <div className="mt-4 text-gray-600">Loading product...</div>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  if (error) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error}
            </h3>
            <div className="space-x-4">
              <Link 
                href="/admin/products"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back to Products
              </Link>
              <button
                onClick={fetchProduct}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  if (!product) {
    return (
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Product not found
            </h3>
            <Link 
              href="/admin/products"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Products
            </Link>
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
            <Link 
              href="/admin/products" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update product information and settings</p>
          </div>

          {/* Product Form */}
          <ProductForm 
            product={product} 
            onSubmit={handleSubmit} 
            loading={updating} 
          />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}