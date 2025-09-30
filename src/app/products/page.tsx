import { Metadata } from 'next'
import { Suspense } from 'react'
import MainLayout from '@/components/layout/main-layout'
import ProductsClient from '@/components/products/products-client'
import { generateMetadata as generateBaseMetadata } from '@/lib/metadata'
import { generateOrganizationSchema, generateWebSiteSchema, combineSchemas } from '@/lib/structured-data'
import StructuredData from '@/components/seo/structured-data'

interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    page?: string
  }
}

// Enable ISR with 5 minute revalidation for product listings
export const revalidate = 300

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { search, category } = searchParams
  
  if (search) {
    return generateBaseMetadata({
      title: `Search Results for "${search}"`,
      description: `Find products matching "${search}". Browse our wide selection with fast shipping and secure checkout.`,
      keywords: [search, 'products', 'search', 'buy online'],
      url: `/products?search=${encodeURIComponent(search)}`,
    })
  }
  
  if (category) {
    return generateBaseMetadata({
      title: `${category} Products`,
      description: `Shop our collection of ${category.toLowerCase()} products. High quality items at great prices.`,
      keywords: [category, 'products', 'buy online', 'e-commerce'],
      url: `/products?category=${encodeURIComponent(category)}`,
    })
  }
  
  return generateBaseMetadata({
    title: 'All Products',
    description: 'Browse our complete product catalog. Find exactly what you need with our advanced search and filtering options.',
    keywords: ['products', 'catalog', 'shop', 'buy online', 'e-commerce'],
    url: '/products',
  })
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  const structuredData = combineSchemas(
    generateOrganizationSchema(),
    generateWebSiteSchema()
  )
  return (
    <MainLayout>
      <StructuredData data={structuredData} />
      <Suspense fallback={<div>Loading...</div>}>
        <ProductsClient searchParams={searchParams} />
      </Suspense>
    </MainLayout>
  )
}