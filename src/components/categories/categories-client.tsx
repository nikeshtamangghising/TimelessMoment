'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProductWithCategory } from '@/types'
import ProductModal from '@/components/products/product-modal'
import BackToTop from '@/components/ui/back-to-top'
import LazyProductGrid from '@/components/products/lazy-product-grid'
import { 
  ChevronRightIcon, 
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  productCount?: number
  children?: Category[]
}

interface ProductsData {
  data: ProductWithCategory[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CategoriesData {
  rootCategories: Category[]
  featuredCategories: Category[]
}

interface CategoriesClientProps {
  searchParams: {
    search?: string
    category?: string
    page?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    brand?: string
    rating?: string
  }
}

export default function CategoriesClient({ searchParams }: CategoriesClientProps) {
  const [categoriesData, setCategoriesData] = useState<CategoriesData | null>(null)
  const [productsData, setProductsData] = useState<ProductsData | null>(null)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [gridColumns, setGridColumns] = useState(4)
  const pageSize = 12 // Changed to 12 as per requirements

  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const productsAbortRef = useRef<AbortController | null>(null)

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategoriesOnce = async () => {
      try {
        setLoadingCategories(true)
        const categoriesResponse = await fetch('/api/categories?type=hierarchy')
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories')
        }
        const categoriesResult = await categoriesResponse.json()
        
        // Transform the API response to match expected structure
        const transformedCategories = (categoriesResult.categories || []).map((category: any) => ({
          ...category,
          productCount: category._count?.products || 0,
          children: category.children?.map((child: any) => ({
            ...child,
            productCount: child._count?.products || 0
          })) || []
        }))
        
        const transformedData = {
          rootCategories: transformedCategories,
          featuredCategories: transformedCategories.slice(0, 6)
        }
        setCategoriesData(transformedData)
      } catch (err) {
        // Do not block UI; filters will still work without category list
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategoriesOnce()
  }, [])

  // Fetch initial products data for LazyProductGrid
  useEffect(() => {
    const fetchInitialProducts = async () => {
      try {
        setLoadingProducts(true)
        setError(null)

        // Cancel any in-flight request
        if (productsAbortRef.current) {
          productsAbortRef.current.abort()
        }
        const controller = new AbortController()
        productsAbortRef.current = controller

        const params = new URLSearchParams()
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value && key !== 'page') params.set(key, value)
        })
        
        // Normalize sort values expected by API
        const sort = searchParams.sort
        if (sort === 'price-low') params.set('sort', 'price-asc')
        else if (sort === 'price-high') params.set('sort', 'price-desc')
        else if (sort === 'rating') params.set('sort', 'rating')
        else if (sort === 'popular') params.set('sort', 'popular')
        else if (sort === 'newest') params.set('sort', 'newest')
        else if (sort) params.set('sort', sort)

        // Initial page with new page size
        params.set('page', '1')
        params.set('limit', String(pageSize))
        params.set('isActive', 'true')
        params.set('_t', Date.now().toString())

        const productsResponse = await fetch(`/api/products?${params.toString()}`, {
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal,
        })
        
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const productsResult = await productsResponse.json()
        setProductsData(productsResult)
        setInitialized(true)
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchInitialProducts()

    // Cleanup to abort when effect re-runs
    return () => {
      if (productsAbortRef.current) {
        productsAbortRef.current.abort()
      }
    }
  }, [searchParams.category, searchParams.search, searchParams.sort, searchParams.minPrice, searchParams.maxPrice, pageSize])

  const handleProductClick = useCallback((product: ProductWithCategory) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const updateFilters = (newFilters: Record<string, string | null>) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    const newUrl = `/categories?${params.toString()}`
    router.push(newUrl, { scroll: false })
  }

  // Map category id -> category (for O(1) lookup)
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    if (categoriesData?.rootCategories) {
      const stack = [...categoriesData.rootCategories]
      while (stack.length) {
        const c = stack.pop() as Category
        map.set(c.id, c)
        if (c.children && c.children.length) stack.push(...c.children)
      }
    }
    return map
  }, [categoriesData])

  const findCategoryById = (id: string | undefined): Category | undefined => {
    if (!id) return undefined
    return categoryMap.get(id)
  }

  const clearFilters = () => {
    router.push('/categories')
  }

  // Generate breadcrumbs
  const breadcrumbs = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Categories', href: '/categories' },
  ]
  
  if (searchParams.category) {
    const catName = findCategoryById(searchParams.category)?.name
    breadcrumbs.push({ name: catName || 'Category', href: `/categories?category=${searchParams.category}` })
  }
  
  if (searchParams.search) {
    breadcrumbs.push({ name: `Search: "${searchParams.search}"`, href: `/search?q=${searchParams.search}` })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 mx-2" />
                )}
                <Link
                  href={breadcrumb.href}
                  className={`inline-flex items-center text-sm font-medium hover:text-indigo-600 ${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-700'
                      : 'text-gray-500'
                  }`}
                >
                  {breadcrumb.icon && (
                    <breadcrumb.icon className="w-4 h-4 mr-2" />
                  )}
                  {breadcrumb.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {/* Products View */}
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Active Filters */}
              {Object.keys(searchParams).filter(key => searchParams[key as keyof typeof searchParams]).length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Active Filters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchParams.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Category: {findCategoryById(searchParams.category)?.name || 'Selected'}
                        <button
                          onClick={() => updateFilters({ category: null })}
                          className="ml-1.5 hover:text-blue-600"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {searchParams.search && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Search: {searchParams.search}
                        <button
                          onClick={() => updateFilters({ search: null })}
                          className="ml-1.5 hover:text-green-600"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={searchParams.minPrice || ''}
                      onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={searchParams.maxPrice || ''}
                      onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Category Selector */}
              {categoriesData?.rootCategories && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
                  <select
                    key={`category-${searchParams.category || 'all'}`}
                    value={searchParams.category || ''}
                    onChange={(e) => {
                      updateFilters({ category: e.target.value || null })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {categoriesData.rootCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.productCount || 0})
                      </option>
                    ))}
                    {/* Also include subcategories */}
                    {categoriesData.rootCategories.map((category) => 
                      category.children?.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {category.name} → {subcategory.name} ({subcategory.productCount || 0})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {/* Products Content */}
          <div className="flex-1">
            {/* Enhanced Responsive Filter & View Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              {/* Mobile-First Layout */}
              <div className="space-y-4">
                {/* Top Row: Results Count & Mobile Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <FunnelIcon className="h-4 w-4" />
                      <span className="hidden xs:inline">Filters</span>
                    </Button>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{productsData?.pagination?.total || 0}</span>
                      <span className="hidden xs:inline"> products found</span>
                      <span className="xs:hidden"> found</span>
                    </div>
                  </div>
                  
                  {/* Mobile View Mode Toggle */}
                  <div className="sm:hidden flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Grid view"
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="List view"
                    >
                      <ListBulletIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Desktop Controls Row */}
                <div className="hidden sm:flex items-center justify-between gap-4">
                  {/* Left Side: View Mode Toggle */}
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      <span className="hidden md:inline">Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ListBulletIcon className="w-4 h-4" />
                      <span className="hidden md:inline">List</span>
                    </button>
                  </div>

                  {/* Right Side: Density & Sort Controls */}
                  <div className="flex items-center gap-3">
                    {/* Grid Density (only for grid view) */}
                    {viewMode === 'grid' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 hidden lg:inline">Density:</span>
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                          {[
                            { value: 3, label: 'L', fullLabel: 'Large' },
                            { value: 4, label: 'M', fullLabel: 'Medium' },
                            { value: 5, label: 'D', fullLabel: 'Dense' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setGridColumns(option.value)}
                              className={`px-2 py-1 text-sm rounded-md transition-colors min-w-[32px] ${
                                gridColumns === option.value 
                                  ? 'bg-white text-gray-900 shadow-sm' 
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                              title={option.fullLabel}
                            >
                              <span className="lg:hidden">{option.label}</span>
                              <span className="hidden lg:inline">{option.fullLabel}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 hidden md:inline">Sort:</span>
                      <select
                        value={searchParams.sort || ''}
                        onChange={(e) => updateFilters({ sort: e.target.value || null })}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[120px]"
                      >
                        <option value="">Default</option>
                        <option value="newest">Newest</option>
                        <option value="price-low">Price ↑</option>
                        <option value="price-high">Price ↓</option>
                        <option value="rating">Rating</option>
                        <option value="popular">Popular</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid with Lazy Loading */}
            {productsData ? (
              <LazyProductGrid
                initialData={productsData}
                searchParams={{
                  search: searchParams.search,
                  category: searchParams.category,
                  sort: searchParams.sort,
                  minPrice: searchParams.minPrice,
                  maxPrice: searchParams.maxPrice,
                  brand: searchParams.brand,
                  rating: searchParams.rating
                }}
                apiEndpoint="/api/products"
                gridColumns={gridColumns}
                viewMode={viewMode}
                onProductClick={handleProductClick}
                trackViews={false}
                compact={true}
                pageSize={pageSize}
              />
            ) : loadingProducts ? (
              /* Loading State */
              <div className="space-y-6">
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-square rounded-2xl mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Error loading products
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {error}
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                </p>
                <div className="space-y-3">
                  <Button onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                  <div>
                    <Link href="/categories" className="text-sm text-indigo-600 hover:text-indigo-700">
                      Browse All Categories
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Modal */}
        <ProductModal 
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
        
        {/* Back to Top Button */}
        <BackToTop />
      </div>
    </div>
  )
}