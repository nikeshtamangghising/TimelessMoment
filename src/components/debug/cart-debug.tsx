'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { Product } from '@/types'

export default function CartDebug() {
  const { items, addItem, removeItem, clearCart } = useCartStore()
  const [testProducts, setTestProducts] = useState<Product[]>([])

  // Create test products
  useEffect(() => {
    const products: Product[] = [
      {
        id: '1',
        name: 'Test Product 1',
        slug: 'test-product-1',
        description: 'Test product 1 description',
        shortDescription: 'Short description 1',
        price: 100,
        discountPrice: 90,
        currency: 'NPR',
        images: ['/placeholder-product.jpg'],
        inventory: 10,
        lowStockThreshold: 2,
        sku: 'TP1',
        weight: 1.5,
        dimensions: null,
        metaTitle: 'Test Product 1',
        metaDescription: 'Test product 1 meta description',
        tags: ['test', 'product'],
        viewCount: 0,
        orderCount: 0,
        favoriteCount: 0,
        cartCount: 0,
        popularityScore: 0,
        lastScoreUpdate: new Date(),
        purchaseCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        categoryId: 'cat1',
        brandId: null,
        isActive: true,
        isFeatured: false,
        isNewArrival: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Test Product 2',
        slug: 'test-product-2',
        description: 'Test product 2 description',
        shortDescription: 'Short description 2',
        price: 200,
        discountPrice: null,
        currency: 'NPR',
        images: ['/placeholder-product.jpg'],
        inventory: 5,
        lowStockThreshold: 1,
        sku: 'TP2',
        weight: 2.0,
        dimensions: null,
        metaTitle: 'Test Product 2',
        metaDescription: 'Test product 2 meta description',
        tags: ['test', 'product'],
        viewCount: 0,
        orderCount: 0,
        favoriteCount: 0,
        cartCount: 0,
        popularityScore: 0,
        lastScoreUpdate: new Date(),
        purchaseCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        categoryId: 'cat2',
        brandId: null,
        isActive: true,
        isFeatured: true,
        isNewArrival: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]
    setTestProducts(products)
  }, [])

  const handleAddProduct = (product: Product) => {
    console.log('Adding product:', product.id, product.name)
    addItem(product, 1)
  }

  const handleClearCart = () => {
    clearCart()
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Cart Debug</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Test Products:</h3>
        <div className="space-y-2">
          {testProducts.map(product => (
            <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded">
              <span>{product.name} (ID: {product.id})</span>
              <button 
                onClick={() => handleAddProduct(product)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Cart Items:</h3>
          <button 
            onClick={handleClearCart}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Cart
          </button>
        </div>
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-gray-500">Cart is empty</p>
          ) : (
            items.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-2 bg-white rounded">
                <span>{item.product.name} (ID: {item.productId}) - Qty: {item.quantity}</span>
                <button 
                  onClick={() => removeItem(item.productId)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}