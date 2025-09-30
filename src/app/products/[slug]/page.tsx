import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import MainLayout from '@/components/layout/main-layout'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { productRepository } from '@/lib/product-repository'
import { Product } from '@/types'
import { generateProductMetadata } from '@/lib/metadata'
import { generateProductSchema, generateBreadcrumbSchema, combineSchemas } from '@/lib/structured-data'
import StructuredData from '@/components/seo/structured-data'

interface ProductPageProps {
  params: {
    slug: string
  }
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await productRepository.findBySlug(slug)
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Generate static params for popular products
export async function generateStaticParams() {
  try {
    const products = await productRepository.findMany(
      { isActive: true },
      { page: 1, limit: 100 } // Pre-generate top 100 products
    )
    
    return products.data.map((product) => ({
      slug: product.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    }
  }

  return generateProductMetadata(product)
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug)

  if (!product || !product.isActive) {
    notFound()
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    { name: product.category, url: `/products?category=${product.category}` },
    { name: product.name, url: `/products/${product.slug}` },
  ]

  const structuredData = combineSchemas(
    generateProductSchema(product),
    generateBreadcrumbSchema(breadcrumbs)
  )

  return (
    <MainLayout>
      <StructuredData data={structuredData} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 w-full">
              <Image
                src={product.images[0] || '/placeholder-product.jpg'}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover rounded-lg"
                priority
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-w-1 aspect-h-1">
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 2}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <nav className="text-sm text-gray-500 mb-4">
                <Link href="/products" className="hover:text-gray-700">Products</Link>
                <span className="mx-2">/</span>
                <Link href={`/products?category=${product.category}`} className="hover:text-gray-700">
                  {product.category}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{product.name}</span>
              </nav>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-indigo-600">
                  ${product.price.toFixed(2)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {product.category}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Availability:</span>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        product.inventory > 0 
                          ? product.inventory <= (product.lowStockThreshold || 5)
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {product.inventory === 0 
                          ? 'Out of stock' 
                          : product.inventory <= (product.lowStockThreshold || 5)
                            ? `Only ${product.inventory} left in stock`
                            : `${product.inventory} in stock`
                        }
                      </span>
                      {product.inventory > 0 && product.inventory <= (product.lowStockThreshold || 5) && (
                        <div className="text-xs text-yellow-600 mt-1">
                          ⚠️ Limited stock - order soon!
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Stock Status:</span>
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
                          ? 'Low Stock'
                          : 'In Stock'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">SKU:</span>
                    <span className="text-sm text-gray-600">{product.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add to Cart Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button className="px-3 py-2 text-gray-600 hover:text-gray-800">
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.inventory}
                    defaultValue="1"
                    className="w-16 px-2 py-2 text-center border-0 focus:ring-0"
                  />
                  <button className="px-3 py-2 text-gray-600 hover:text-gray-800">
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  size="lg"
                  disabled={product.inventory === 0}
                  className="flex-1"
                >
                  {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                >
                  ♡ Wishlist
                </Button>
              </div>
            </div>

            {/* Product Features */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                    Free shipping on orders over $50
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                    30-day return policy
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                    1-year warranty included
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                    Secure payment processing
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}