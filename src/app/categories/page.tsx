import { Metadata } from 'next'
import Link from 'next/link'
import MainLayout from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { productRepository } from '@/lib/product-repository'
import { generateMetadata as generateBaseMetadata } from '@/lib/metadata'
import { generateOrganizationSchema, generateWebSiteSchema, combineSchemas } from '@/lib/structured-data'
import StructuredData from '@/components/seo/structured-data'

export const metadata: Metadata = generateBaseMetadata({
  title: 'Product Categories',
  description: 'Browse our product categories. Find exactly what you need from electronics to clothing, home goods and more.',
  keywords: ['categories', 'products', 'shop', 'browse', 'electronics', 'clothing', 'home'],
  url: '/categories',
})

async function getCategories() {
  try {
    return await productRepository.getCategories()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

async function getCategoryStats() {
  try {
    const categories = await productRepository.getCategories()
    const stats = await Promise.all(
      categories.map(async (category) => {
        const result = await productRepository.findMany(
          { category, isActive: true },
          { page: 1, limit: 1 }
        )
        return {
          name: category,
          count: result.pagination.total,
        }
      })
    )
    return stats
  } catch (error) {
    console.error('Error fetching category stats:', error)
    return []
  }
}

export default async function CategoriesPage() {
  const categoryStats = await getCategoryStats()

  const structuredData = combineSchemas(
    generateOrganizationSchema(),
    generateWebSiteSchema()
  )

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
  }

  return (
    <MainLayout>
      <StructuredData data={structuredData} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our wide range of products organized by category. 
            Find exactly what you're looking for with ease.
          </p>
        </div>

        {categoryStats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryStats.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">
                      {categoryIcons[category.name] || '📦'}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.count} {category.count === 1 ? 'product' : 'products'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No categories available
            </h3>
            <p className="text-gray-500">
              Categories will appear here once products are added to the store.
            </p>
          </div>
        )}

        {/* Featured Categories Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Popular Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">Electronics</h3>
                <p className="text-blue-100 mb-4">
                  Latest gadgets and tech accessories
                </p>
                <Link
                  href="/products?category=Electronics"
                  className="inline-flex items-center text-white hover:text-blue-100"
                >
                  Shop now →
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">Home & Garden</h3>
                <p className="text-green-100 mb-4">
                  Everything for your home and garden
                </p>
                <Link
                  href="/products?category=Home"
                  className="inline-flex items-center text-white hover:text-green-100"
                >
                  Shop now →
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-2">Fashion</h3>
                <p className="text-purple-100 mb-4">
                  Trendy clothing and accessories
                </p>
                <Link
                  href="/products?category=Clothing"
                  className="inline-flex items-center text-white hover:text-purple-100"
                >
                  Shop now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}