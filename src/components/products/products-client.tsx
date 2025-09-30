'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductGrid from '@/components/products/product-grid'
import SearchForm from '@/components/forms/search-form'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import { Product, PaginatedResponse } from '@/types'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ProductsClientProps {
  searchParams: {
    search?: string
    category?: string
    page?: string
  }
}

export default function ProductsClient({ searchParams }: ProductsClientProps) {
  const router = useRouter()
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Initialize state from URL params
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.category || '')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.page || '1'))
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, priceRange, searchQuery, currentPage])

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
    setError(null)

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      })

      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (priceRange.min) params.append('minPrice', priceRange.min)
      if (priceRange.max) params.append('maxPrice', priceRange.max)
      params.append('isActive', 'true')

      const response = await fetch(`/api/products?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data)
    } catch (error) {
      setError('Failed to load products. Please try again.')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams()
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })

    const newURL = `/products${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newURL, { scroll: false })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    updateURL({
      search: query,
      category: selectedCategory,
      page: '1',
    })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    updateURL({
      search: searchQuery,
      category,
      page: '1',
    })
  }

  const handlePriceRangeChange = () => {
    setCurrentPage(1)
    fetchProducts()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL({
      search: searchQuery,
      category: selectedCategory,
      page: page.toString(),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setPriceRange({ min: '', max: '' })
    setSearchQuery('')
    setCurrentPage(1)
    router.push('/products')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </Button>
        </div>
        <SearchForm
          onSearch={handleSearch}
          initialValue={searchQuery}
          placeholder="Search products..."
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block lg:w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Filter */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={selectedCategory === ''}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="mr-2"
                    />
                    All Categories
                  </label>
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={selectedCategory === category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="mr-2"
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handlePriceRangeChange}
                    className="w-full"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loading size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchProducts}>Try Again</Button>
            </div>
          ) : products ? (
            <>
              {/* Results Header */}
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  Showing {products.data.length} of {products.pagination.total} products
                  {searchQuery && ` for "${searchQuery}"`}
                  {selectedCategory && ` in ${selectedCategory}`}
                </p>
              </div>

              {/* Products Grid */}
              <ProductGrid products={products.data} />

              {/* Pagination */}
              {products.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
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
          ) : null}
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Filters</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 rounded-md hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mobile-category"
                        value=""
                        checked={selectedCategory === ''}
                        onChange={(e) => {
                          handleCategoryChange(e.target.value)
                          setShowMobileFilters(false)
                        }}
                        className="mr-2"
                      />
                      All Categories
                    </label>
                    {categories.map((category) => (
                      <label key={`mobile-${category}`} className="flex items-center">
                        <input
                          type="radio"
                          name="mobile-category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => {
                            handleCategoryChange(e.target.value)
                            setShowMobileFilters(false)
                          }}
                          className="mr-2"
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        handlePriceRangeChange()
                        setShowMobileFilters(false)
                      }}
                      className="w-full"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
