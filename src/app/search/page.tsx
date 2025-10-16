import { Metadata } from 'next'
import { Suspense } from 'react'
import MainLayout from '@/components/layout/main-layout'
import SearchPageClient from '@/components/search/search-page-client'
import { generateMetadata as generateBaseMetadata } from '@/lib/metadata'
import { generateOrganizationSchema, generateWebSiteSchema, combineSchemas } from '@/lib/structured-data'
import StructuredData from '@/components/seo/structured-data'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    page?: string
    sort?: string
    minPrice?: string
    maxPrice?: string
    brand?: string
    rating?: string
  }>
}

// Enable ISR with 5 minute revalidation
export const revalidate = 300

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const { q: query } = params
  
  if (query) {
    return generateBaseMetadata({
      title: `Search Results for "${query}"`,
      description: `Find products matching "${query}". Browse our wide selection with fast shipping and secure checkout.`,
      keywords: [query, 'search', 'products', 'buy online'],
      url: `/search?q=${encodeURIComponent(query)}`,
    })
  }
  
  return generateBaseMetadata({
    title: 'Search Products',
    description: 'Search our complete product catalog. Find exactly what you need with our advanced search and filtering options.',
    keywords: ['search', 'products', 'find', 'shop', 'buy online', 'e-commerce'],
    url: '/search',
  })
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  
  const structuredData = combineSchemas(
    generateOrganizationSchema(),
    generateWebSiteSchema()
  )
  
  return (
    <MainLayout>
      <StructuredData data={structuredData} />
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Search Header Skeleton */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
            </div>
            
            {/* Search Bar Skeleton */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-gray-200 rounded-2xl h-20"></div>
            </div>
            
            {/* Products Grid Skeleton */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-80 bg-gray-300 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      }>
        <SearchPageClient searchParams={params} />
      </Suspense>
    </MainLayout>
  )
}