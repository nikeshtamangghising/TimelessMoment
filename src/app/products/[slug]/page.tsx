import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import dynamicImport from 'next/dynamic'
import MainLayout from '@/components/layout/main-layout'
import { productRepository } from '@/lib/product-repository'
import { Product } from '@/types'
import { generateProductMetadata } from '@/lib/metadata'
import { generateProductSchema, generateBreadcrumbSchema, combineSchemas } from '@/lib/structured-data'
import StructuredData from '@/components/seo/structured-data'
import ProductTabs from '@/components/products/product-tabs'
import ProductImageGallery from '@/components/products/product-image-gallery'
import ProductInfoSection from '@/components/products/product-info-section'
import MobileProductActions from '@/components/products/mobile-product-actions'
import ScrollToTop from '@/components/ui/scroll-to-top'

// Force dynamic rendering to avoid DYNAMIC_SERVER_USAGE errors
export const dynamic = 'force-dynamic'

// Lazy load RecommendedProducts to improve initial page load
const RecommendedProducts = dynamicImport(
  () => import('@/components/products/recommended-products'),
  { 
    loading: () => (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await productRepository.findBySlug(slug)
  } catch (error) {
    return null
  }
}

// Generate static params for popular products
// Temporarily disabled to prevent build issues without database
export async function generateStaticParams() {
  // Return empty array to disable static generation during build
  // In production with database, enable this for better performance
  return []
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.slug)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    }
  }

  return generateProductMetadata(product)
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.slug)

  if (!product || !product.isActive) {
    notFound()
  }

  // Increment view count (best-effort, non-blocking)
  productRepository.incrementViewCount(product.id).catch(() => {
    // Ignore errors - view count is not critical
  })

  const productWithCategory = product as any
  const categoryName = typeof productWithCategory.category === 'object' 
    ? productWithCategory.category?.name 
    : productWithCategory.category || 'Uncategorized'
    
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: categoryName, url: `/products?category=${categoryName}` },
    { name: product.name, url: `/products/${product.slug}` },
  ]

  const structuredData = combineSchemas(
    generateProductSchema(product),
    generateBreadcrumbSchema(breadcrumbs)
  )

  return (
    <MainLayout>
      <StructuredData data={structuredData} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Product Info */}
          <div>
            <ProductInfoSection product={product} />
          </div>
        </div>

        {/* Product Tabs - Specifications and Reviews */}
        <div className="mt-12">
          <ProductTabs product={product} />
        </div>

        {/* Recommended Products */}
        <div className="mt-12">
          <RecommendedProducts productId={product.id} />
        </div>
      </div>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
      
      {/* Mobile Fixed Action Buttons */}
      <MobileProductActions product={product} />
    </MainLayout>
  )
}