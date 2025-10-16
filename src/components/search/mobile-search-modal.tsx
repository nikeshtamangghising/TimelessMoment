'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'
import { Product } from '@/types'

interface MobileSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const cache = useRef<Map<string, Product[]>>(new Map())

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Fetch popular searches on mount
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await fetch('/api/search/popular')
        if (response.ok) {
          const data = await response.json()
          setPopularSearches(data.searches || [])
        }
      } catch (error) {
        setPopularSearches(['Laptop', 'Phone', 'Headphones', 'Watch', 'Camera'])
      }
    }
    
    if (isOpen) {
      fetchPopularSearches()
      // Load recent searches from localStorage
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      setRecentSearches(recent.slice(0, 5))
    }
  }, [isOpen])

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSuggestions(query.trim())
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setIsLoading(true)
      
      // Check cache first
      const cacheKey = searchQuery.toLowerCase().trim()
      if (cache.current.has(cacheKey)) {
        const cachedResults = cache.current.get(cacheKey)!
        setSuggestions(cachedResults)
        setIsLoading(false)
        return
      }
      
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
      
      if (response.ok) {
        const data = await response.json()
        const products = data.products || []
        
        // Cache results
        cache.current.set(cacheKey, products)
        setSuggestions(products)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Save to recent searches
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      const updated = [searchQuery, ...recent.filter(s => s !== searchQuery)].slice(0, 10)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      
      // Navigate to search results
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      onClose()
    }
  }

  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.slug}`)
    onClose()
  }

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches')
    setRecentSearches([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch(query)
                }
              }}
              className="block w-full pl-10 pr-4 py-3 text-lg border-0 bg-gray-50 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search products..."
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {query.trim().length >= 2 ? (
            /* Product Suggestions */
            <div className="p-4">
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Products</h3>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="w-12 h-12 flex-shrink-0">
                        <Image
                          src={product.images[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>{formatCurrency(product.price, product.currency || DEFAULT_CURRENCY)}</span>
                          <span>•</span>
                          <span>{(product as any).category?.name || 'Uncategorized'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* View All Results */}
                  <button
                    onClick={() => handleSearch(query)}
                    className="w-full p-3 text-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    View all results for "{query}"
                  </button>
                </div>
              ) : !isLoading ? (
                <div className="p-8 text-center">
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No products found for "{query}"</p>
                  <button
                    onClick={() => handleSearch(query)}
                    className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Search anyway
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* Popular & Recent Searches */
            <div className="p-4 space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Recent</h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(term)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="text-gray-900">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Popular</h3>
                  <div className="space-y-2">
                    {popularSearches.slice(0, 8).map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(term)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                          <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-gray-900">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}