'use client'

import { useState } from 'react'
import ProductCard from '@/components/products/product-card'
import { ProductWithCategory } from '@/types'

// Mock product data for testing
const mockProducts: ProductWithCategory[] = [
  {
    id: '1',
    slug: 'test-product-1',
    name: 'Test Product 1',
    description: 'Test product description 1',
    shortDescription: 'Short description 1',
    price: 29.99,
    discountPrice: 19.99,
    currency: 'USD',
    images: ['/placeholder-product.svg'],
    inventory: 10,
    lowStockThreshold: 5,
    sku: 'TP001',
    weight: 1.5,
    dimensions: { length: 10, width: 5, height: 3 },
    metaTitle: 'Test Product 1',
    metaDescription: 'Test product 1 meta description',
    tags: ['test', 'electronics'],
    viewCount: 0,
    orderCount: 0,
    favoriteCount: 0,
    cartCount: 0,
    popularityScore: 0,
    lastScoreUpdate: new Date(),
    purchaseCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    categoryId: '1',
    brandId: null,
    isActive: true,
    isFeatured: false,
    isNewArrival: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic products',
      metaTitle: 'Electronics',
      metaDescription: 'Electronic products category',
      image: '/category-electronics.jpg',
      isActive: true,
      parentId: null,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    brand: null
  },
  {
    id: '2',
    slug: 'test-product-2',
    name: 'Test Product 2',
    description: 'Test product description 2',
    shortDescription: 'Short description 2',
    price: 39.99,
    discountPrice: null,
    currency: 'USD',
    images: ['/placeholder-product.svg'],
    inventory: 5,
    lowStockThreshold: 2,
    sku: 'TP002',
    weight: 2.0,
    dimensions: { length: 15, width: 8, height: 5 },
    metaTitle: 'Test Product 2',
    metaDescription: 'Test product 2 meta description',
    tags: ['test', 'clothing'],
    viewCount: 0,
    orderCount: 0,
    favoriteCount: 0,
    cartCount: 0,
    popularityScore: 0,
    lastScoreUpdate: new Date(),
    purchaseCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    categoryId: '2',
    brandId: null,
    isActive: true,
    isFeatured: true,
    isNewArrival: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: '2',
      name: 'Clothing',
      slug: 'clothing',
      description: 'Clothing products',
      metaTitle: 'Clothing',
      metaDescription: 'Clothing products category',
      image: '/category-clothing.jpg',
      isActive: true,
      parentId: null,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    brand: null
  },
  {
    id: '3',
    slug: 'test-product-3',
    name: 'Test Product 3',
    description: 'Test product description 3',
    shortDescription: 'Short description 3',
    price: 49.99,
    discountPrice: 39.99,
    currency: 'USD',
    images: ['/placeholder-product.svg'],
    inventory: 0,
    lowStockThreshold: 3,
    sku: 'TP003',
    weight: 1.2,
    dimensions: { length: 12, width: 6, height: 4 },
    metaTitle: 'Test Product 3',
    metaDescription: 'Test product 3 meta description',
    tags: ['test', 'home'],
    viewCount: 0,
    orderCount: 0,
    favoriteCount: 0,
    cartCount: 0,
    popularityScore: 0,
    lastScoreUpdate: new Date(),
    purchaseCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    categoryId: '3',
    brandId: null,
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: '3',
      name: 'Home',
      slug: 'home',
      description: 'Home products',
      metaTitle: 'Home',
      metaDescription: 'Home products category',
      image: '/category-home.jpg',
      isActive: true,
      parentId: null,
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    brand: null
  }
]

export default function LoadingTestPage() {
  const [addedProducts, setAddedProducts] = useState<string[]>([])

  const handleAddToCart = (productId: string) => {
    console.log(`Add to cart clicked for product ${productId}`)
    // Simulate adding to cart
    setAddedProducts(prev => [...prev, productId])
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Loading State Test</h1>
      <p className="mb-6">Click on different "Add to Cart" buttons to verify that only the clicked button shows loading state.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
      
      {addedProducts.length > 0 && (
        <div className="mt-8 p-4 bg-green-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Added Products:</h2>
          <ul>
            {addedProducts.map(id => (
              <li key={id}>Product {id} added to cart</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}