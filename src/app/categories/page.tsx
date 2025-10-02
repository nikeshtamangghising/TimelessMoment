import { Metadata } from 'next'
import { Suspense } from 'react'
import MainLayout from '@/components/layout/main-layout'
import CategoriesClient from '@/components/categories/categories-client'
import { generateMetadata as generateBaseMetadata } from '@/lib/metadata'
import { generateOrganizationSchema, generateWebSiteSchema, combineSchemas } from '@/lib/structured-data'
import StructuredData from '@/components/seo/structured-data'

interface CategoriesPageProps {
  searchParams: Promise<{
    search?: string
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

export async function generateMetadata({ searchParams }: CategoriesPageProps): Promise<Metadata> {
  const params = await searchParams
  const { search, category } = params
  
  if (search) {
    return generateBaseMetadata({
      title: `Search Results for "${search}"`,
      description: `Find products matching "${search}". Browse our wide selection with fast shipping and secure checkout.`,
      keywords: [search, 'products', 'search', 'buy online'],
      url: `/categories?search=${encodeURIComponent(search)}`,
    })
  }
  
  if (category) {
    return generateBaseMetadata({
      title: `${category} Products`,
      description: `Shop our collection of ${category.toLowerCase()} products. High quality items at great prices.`,
      keywords: [category, 'products', 'buy online', 'e-commerce'],
      url: `/categories?category=${encodeURIComponent(category)}`,
    })
  }
  
  return generateBaseMetadata({
    title: 'Categories & Products',
    description: 'Browse our complete product catalog by category. Find exactly what you need with our advanced search and filtering options.',
    keywords: ['categories', 'products', 'catalog', 'shop', 'buy online', 'e-commerce'],
    url: '/categories',
  })
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
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
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }>
        <CategoriesClient key={`${params.category || 'all'}-${params.search || ''}-${params.page || '1'}`} searchParams={params} />
      </Suspense>
    </MainLayout>
  )
}
