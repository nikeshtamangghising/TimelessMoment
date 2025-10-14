'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductWithCategory } from '@/types'
import ProductCard from '@/components/products/product-card'
import ProductModal from '@/components/products/product-modal'
import BackToTop from '@/components/ui/back-to-top'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'
import { 
  ChevronRightIcon, 
  AdjustmentsHorizontalIcon, 
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid 
} from '@heroicons/react/24/solid'

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
  const [availableFilters, setAvailableFilters] = useState<any>(null)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [gridColumns, setGridColumns] = useState(5)
  const [allProducts, setAllProducts] = useState<ProductWithCategory[]>([])
  const [displayedProducts, setDisplayedProducts] = useState<ProductWithCategory[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 24

  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const productsAbortRef = useRef<AbortController | null>(null)

  // Always show products interface - no category browsing mode
  const hasActiveFilters = true

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    Electronics: '📱',
    Clothing: '👕',
    Books: '📚',
    Home: '🏠',
    Sports: '⚽',
    Beauty: '💄',
    Toys: '🧸',
    Automotive: '🚗',
    Garden: '🌱',
    Health: '💊',
    Food: '🍎',
    Jewelry: '💎',
    Pets: '🐕',
    Office: '💼',
    Outdoors: '🏕️',
    Music: '🎵',
    Art: '🎨',
    Baby: '🍼',
    Industrial: '🏭',
    'Gift Cards': '🎁',
  }

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
        console.error('Error fetching categories:', err)
        // Do not block UI; filters will still work without category list
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategoriesOnce()
  }, [])

  // Fetch products whenever filters/search change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        setError(null)
        setCurrentPage(1)

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

        // Pagination
        params.set('page', '1')
        params.set('limit', String(pageSize))

        // Add isActive=true to only show active products
        params.set('isActive', 'true')
        // Add cache busting
        params.set('_t', Date.now().toString())

        const productsResponse = await fetch(`/api/products?${params.toString()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
          signal: controller.signal,
        })
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products')
        }
        const productsResult = await productsResponse.json()
        setProductsData(productsResult)

        // Initial page of products
        const products = productsResult.data || []
        setAllProducts(products)
        setDisplayedProducts(products)
        const tp = productsResult.pagination?.totalPages || 1
        setTotalPages(tp)
        const cp = productsResult.pagination?.page || 1
        setCurrentPage(cp)
        setHasMore(cp < tp)

        // Fetch available filters only on first load
        if (!initialized) {
          try {
            const filtersResponse = await fetch('/api/products/filters')
            if (filtersResponse.ok) {
              const filtersResult = await filtersResponse.json()
              setAvailableFilters(filtersResult)
            }
          } catch (e) {
            // ignore filters failure
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return
        }
        console.error('Error fetching products:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoadingProducts(false)
        setInitialized(true)
      }
    }

    fetchProducts()

    // Cleanup to abort when effect re-runs
    return () => {
      if (productsAbortRef.current) {
        productsAbortRef.current.abort()
      }
    }
  }, [searchParams.category, searchParams.search, searchParams.sort, searchParams.minPrice, searchParams.maxPrice])

  const handleProductClick = useCallback((product: ProductWithCategory) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const updateFilters = (newFilters: Record<string, string | null>) => {
    console.log('updateFilters called with:', newFilters)
    const params = new URLSearchParams(urlSearchParams.toString())
    console.log('Current URL params:', params.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    const newUrl = `/categories?${params.toString()}`
    console.log('Navigating to:', newUrl)
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
  
  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    try {
      const nextPage = currentPage + 1
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

      params.set('page', String(nextPage))
      params.set('limit', String(pageSize))
      params.set('isActive', 'true')
      params.set('_t', Date.now().toString())

      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!response.ok) throw new Error('Failed to load more products')
      const result = await response.json()

      const newProducts = result.data || []
      const combined = [...allProducts, ...newProducts]
      setAllProducts(combined)
      setDisplayedProducts(combined)
      const tp = result.pagination?.totalPages || totalPages
      setTotalPages(tp)
      setCurrentPage(nextPage)
      setHasMore(nextPage < tp)
    } catch (e) {
      console.error('Load more failed:', e)
    } finally {
      setLoadingMore(false)
    }
  }

  // Initial loading skeleton only on first load
  if (!initialized && loadingProducts) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-300 rounded-lg animate-pulse">
                <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Unable to load content
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
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
    breadcrumbs.push({ name: `Search: "${searchParams.search}"`, href: `/categories?search=${searchParams.search}` })
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


        {/* Products View - always active now */}
        {productsData ? (
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
                        console.log('Category changed to (id):', e.target.value)
                        console.log('Current searchParams.category:', searchParams.category)
                        // Store the category ID in the query param so the API can filter by categoryId
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
              {/* Filter & View Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden"
                    >
                      <FunnelIcon className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                    <span className="text-sm text-gray-600">
                      <strong>{productsData.pagination?.total || 0}</strong> products found
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* View Mode Toggle */}
                    <div className="hidden sm:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'grid' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
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
                      >
                        <ListBulletIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Grid Density (only for grid view) */}
                    {viewMode === 'grid' && (
                      <div className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                        {[
                          { value: 3, label: 'Large' },
                          { value: 4, label: 'Medium' },
                          { value: 5, label: 'Dense' },
                          { value: 6, label: 'Compact' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setGridColumns(option.value)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              gridColumns === option.value 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Sort Dropdown */}
                    <select
                      value={searchParams.sort || ''}
                      onChange={(e) => updateFilters({ sort: e.target.value || null })}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Sort by</option>
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {displayedProducts && displayedProducts.length > 0 ? (
                <div>
                  {viewMode === 'grid' ? (
                    <div className={`grid gap-3 md:gap-4 ${
                      gridColumns === 3 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3' :
                      gridColumns === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                      gridColumns === 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' :
                      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                    }`}>
                      {displayedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onProductClick={handleProductClick}
                          trackViews={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayedProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 flex-shrink-0">
                              <Image
                                src={product.images[0] || '/placeholder-product.jpg'}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 25vw, 15vw"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
                              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-xl font-bold text-indigo-600">{formatCurrency(product.price, product.currency || DEFAULT_CURRENCY)}</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {product.category.name}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.inventory === 0 
                                    ? 'bg-red-100 text-red-800'
                                    : product.inventory <= (product.lowStockThreshold || 5)
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                }`}>
                                  {product.inventory === 0 
                                    ? 'Out of Stock'
                                    : product.inventory <= (product.lowStockThreshold || 5)
                                      ? `${product.inventory} left`
                                      : 'In Stock'
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Button
                                onClick={() => handleProductClick(product)}
                                variant="outline"
                                size="sm"
                              >
                                View Details
                              </Button>
                              <Button
                                onClick={() => {}}
                                disabled={product.inventory === 0}
                                size="sm"
                              >
                                {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={loadMore}
                        disabled={loadingMore}
                        size="lg"
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
                      >
                        {loadingMore ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading More...
                          </>
                        ) : (
                          <>Load More Products</>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Products Count */}
                  <div className="mt-6 text-center">
                    <span className="text-sm text-gray-500">
                      Showing {displayedProducts.length} of {allProducts.length} products
                      {allProducts.length > displayedProducts.length && (
                        <span className="ml-2 text-blue-600 font-medium">
                          · {allProducts.length - displayedProducts.length} more available
                        </span>
                      )}
                    </span>
                  </div>
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
            </div>
          </div>
        )}

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
