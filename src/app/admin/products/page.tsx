'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Loading from '@/components/ui/loading'
import { Product, PaginatedResponse } from '@/types'
import { formatPrice } from '@/lib/cart-utils'

function AdminProductsPageContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [recalcMessage, setRecalcMessage] = useState<string>('')

  useEffect(() => {
    fetchCategories()
    
    // Check for success messages from URL params
    if (searchParams.get('created') === 'true') {
      setSuccessMessage('Product created successfully!')
    } else if (searchParams.get('updated') === 'true') {
      setSuccessMessage('Product updated successfully!')
    }
    
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, successMessage])

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchQuery, selectedCategory, showActiveOnly])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })

      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (showActiveOnly) params.append('isActive', 'true')

      const response = await fetch(`/api/products?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products'
      setError(errorMessage)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchProducts()
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      // Refresh products list
      fetchProducts()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product'
      alert(errorMessage)
    }
  }

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update product status')
      }

      // Refresh products list
      fetchProducts()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product'
      alert(errorMessage)
    }
  }

  const handleRecalculateMetrics = async () => {
    try {
      setRecalcLoading(true)
      setRecalcMessage('')
      const response = await fetch('/api/admin/products/recalculate-metrics', {
        method: 'POST'
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to recalculate metrics')
      }
      setRecalcMessage('Metrics recalculated and popularity scores updated.')
      // Refresh current page data after recalculation
      fetchProducts()
    } catch (e) {
      setRecalcMessage(e instanceof Error ? e.message : 'Failed to recalculate metrics')
    } finally {
      setRecalcLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setSuccessMessage('')}
                    className="inline-flex text-green-400 hover:text-green-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recalc Message */}
          {recalcMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">{recalcMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600">Manage your product inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRecalculateMetrics}
                disabled={recalcLoading}
                className="flex items-center space-x-2"
                title="Recalculate product metrics and refresh popularity scores"
              >
                {recalcLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5 9a7 7 0 0114 0M5 15a7 7 0 0014 0" />
                    </svg>
                    <span>Recalculate Metrics</span>
                  </>
                )}
              </Button>
              <Link href="/admin/products/new">
                <Button className="flex items-center space-x-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={showActiveOnly ? 'active' : 'all'}
                      onChange={(e) => setShowActiveOnly(e.target.value === 'active')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">All Products</option>
                      <option value="active">Active Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="flex items-center space-x-2">
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    <span>Search</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('')
                      setShowActiveOnly(true)
                      setCurrentPage(1)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {products ? `${products.pagination.total} Products` : 'Products'}
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loading size="lg" />
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchProducts}>Try Again</Button>
                </div>
              ) : products && products.data.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Inventory
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.data.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  <Image
                                    src={product.images[0] || '/placeholder-product.svg'}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="h-12 w-12 rounded-md object-cover"
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {product.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {typeof (product as any).category === 'string' ? (product as any).category : (product as any).category?.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatPrice(product.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`${
                                product.inventory <= 10 ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {product.inventory}
                              </span>
                              {product.inventory <= 10 && (
                                <span className="ml-1 text-xs text-red-500">(Low)</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleStatus(product.id, product.isActive)}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.isActive
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {product.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Link href={`/products/${product.slug}`}>
                                  <Button variant="ghost" size="sm">
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/admin/products/${product.id}/edit`}>
                                  <Button variant="ghost" size="sm">
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {products.pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          Previous
                        </Button>
                        
                        {Array.from({ length: products.pagination.totalPages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === products.pagination.totalPages || 
                            Math.abs(page - currentPage) <= 2
                          )
                          .map((page, index, array) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-500">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'primary' : 'outline'}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            </div>
                          ))}
                        
                        <Button
                          variant="outline"
                          disabled={currentPage === products.pagination.totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <CubeIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery || selectedCategory 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first product.'
                    }
                  </p>
                  <Link href="/admin/products/new">
                    <Button>Add Product</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <div className="mt-4 text-gray-600">Loading products...</div>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    }>
      <AdminProductsPageContent />
    </Suspense>
  )
}
