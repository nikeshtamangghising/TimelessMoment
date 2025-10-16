'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency'
import { Product } from '@/types'

interface SearchAutocompleteProps {
  placeholder?: string
  className?: string
  onClose?: () => void
}

export default function SearchAutocomplete({ 
  placeholder = "Search products...", 
  className = "",
  onClose 
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLElement | null)[]>([])
  const cache = useRef<Map<string, Product[]>>(new Map())

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSuggestions(query.trim())
      } else {
        setSuggestions([])
        setIsOpen(false)
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
        setIsOpen(true)
        setSelectedIndex(-1)
        setIsLoading(false)
        return
      }
      
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=6`)
      
      if (response.ok) {
        const data = await response.json()
        const products = data.products || []
        
        // Cache results
        cache.current.set(cacheKey, products)
        
        // Limit cache size to prevent memory issues
        if (cache.current.size > 50) {
          const firstKey = cache.current.keys().next().value
          cache.current.delete(firstKey)
        }
        
        setSuggestions(products)
        setIsOpen(true)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      setIsOpen(false)
      onClose?.()
    }
  }

  const handleSuggestionClick = (product: Product) => {
    router.push(`/products/${product.slug}`)
    setQuery('')
    setIsOpen(false)
    onClose?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSubmit(e)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true)
            }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            placeholder={placeholder}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-3 py-2">
              Products ({suggestions.length})
            </div>
            {suggestions.map((product, index) => (
              <button
                key={product.id}
                ref={(el) => {
                  suggestionRefs.current[index] = el
                }}
                onClick={() => handleSuggestionClick(product)}
                className={`w-full text-left px-3 py-3 rounded-md transition-colors flex items-center space-x-3 ${
                  index === selectedIndex
                    ? 'bg-indigo-50 text-indigo-900'
                    : 'hover:bg-gray-50 text-gray-900'
                }`}
              >
                <div className="flex-shrink-0">
                  <img
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {(product as any).category?.name || 'Uncategorized'} • {formatCurrency(product.price, product.currency || DEFAULT_CURRENCY)}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* View All Results Footer */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={handleSubmit}
              className="w-full text-center py-2 px-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
            >
              View all results for "{query}"
            </button>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {isOpen && !isLoading && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 text-center text-gray-500">
            <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm">No products found for "{query}"</p>
            <button
              onClick={handleSubmit}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Search anyway
            </button>
          </div>
        </div>
      )}
    </div>
  )
}