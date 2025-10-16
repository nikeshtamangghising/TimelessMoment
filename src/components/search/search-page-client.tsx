'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SearchForm from '@/components/forms/search-form'
import CategoriesClient from '@/components/categories/categories-client'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchPageClientProps {
  searchParams: {
    q?: string
    category?: string
    page?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    brand?: string
    rating?: string
  }
}

export default function SearchPageClient({ searchParams }: SearchPageClientProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '')
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.q || '')
  }, [searchParams.q])

  // Fetch popular searches from real data
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await fetch('/api/search/popular')
        if (response.ok) {
          const data = await response.json()
          setPopularSearches(data.searches || [])
        }
      } catch (error) {
        // Fallback to static popular searches
        setPopularSearches(['Laptop', 'Headphones', 'Phone', 'Watch', 'Camera', 'Tablet', 'Speaker', 'Mouse'])
      }
    }
    fetchPopularSearches()
  }, [])

  // Filter suggestions based on current input
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // Show popular searches when input is empty
      setFilteredSuggestions(popularSearches)
    } else {
      // Filter popular searches that match current input
      const filtered = popularSearches.filter(search =>
        search.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredSuggestions(filtered)
    }
  }, [searchQuery, popularSearches])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setIsLoading(true)
      // Update URL with new search query
      const params = new URLSearchParams(urlSearchParams.toString())
      params.set('q', query.trim())
      params.delete('page') // Reset to first page on new search
      router.push(`/search?${params.toString()}`)
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Show suggestions when user starts typing or focuses
    if (value.length >= 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputFocus = () => {
    // Always show suggestions on focus if we have any
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200)
  }

  // Convert 'q' parameter to 'search' for CategoriesClient compatibility
  const categoriesSearchParams = {
    ...searchParams,
    search: searchParams.q,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Clean Search Bar with Mobile Button */}
      <div className="max-w-2xl mx-auto mb-8 relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch(searchQuery)
                }
                if (e.key === 'Escape') {
                  setShowSuggestions(false)
                }
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200"
              placeholder="Search products..."
              autoComplete="off"
            />
          </div>
          
          {/* Mobile Search Button */}
          <button
            onClick={() => handleSearch(searchQuery)}
            disabled={!searchQuery.trim() || isLoading}
            className="md:hidden flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Smart Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-3 py-2 border-b border-gray-100">
                {searchQuery.trim() === '' ? 'Popular searches' : 'Suggestions'}
              </div>
              {filteredSuggestions.slice(0, 8).map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(term)}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3 group"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-gray-900 group-hover:text-blue-600">
                    {searchQuery.trim() === '' ? (
                      term
                    ) : (
                      <>
                        {term.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                          <span
                            key={i}
                            className={
                              part.toLowerCase() === searchQuery.toLowerCase()
                                ? 'font-semibold text-blue-600'
                                : ''
                            }
                          >
                            {part}
                          </span>
                        ))}
                      </>
                    )}
                  </span>
                </button>
              ))}
              
              {/* Show "Search for [query]" option when user types something new */}
              {searchQuery.trim() !== '' && !filteredSuggestions.some(s => s.toLowerCase() === searchQuery.toLowerCase()) && (
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="w-full text-left px-3 py-3 hover:bg-blue-50 transition-colors flex items-center space-x-3 group border-t border-gray-100"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600 font-medium">
                    Search for "{searchQuery}"
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchParams.q ? (
        <div>
          {/* Results count header */}
          <div className="mb-6">
            <h1 className="text-xl font-medium text-gray-900">
              Search results for "{searchParams.q}"
            </h1>
          </div>
          <CategoriesClient searchParams={categoriesSearchParams} />
        </div>
      ) : (
        <div className="text-center py-16">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Start typing to search for products</p>
        </div>
      )}
    </div>
  )
}