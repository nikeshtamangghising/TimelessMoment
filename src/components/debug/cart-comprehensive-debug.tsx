'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/stores/cart-store'

export default function CartComprehensiveDebug() {
  const { items, addItem, removeItem, clearCart, getTotalItems } = useCartStore()
  const [testProducts, setTestProducts] = useState<any[]>([])
  const [testCount, setTestCount] = useState(1)

  // Create test products
  useEffect(() => {
    const products = [
      {
        id: 'prod-1',
        name: 'Test Product 1',
        slug: 'test-product-1',
        description: 'Test product 1 description',
        shortDescription: 'Short description 1',
        price: 100,
        discountPrice: 90,
        currency: 'USD',
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
        lastScoreUpdate: new Date().toISOString(),
        purchaseCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        categoryId: 'cat1',
        brandId: null,
        isActive: true,
        isFeatured: false,
        isNewArrival: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-2',
        name: 'Test Product 2',
        slug: 'test-product-2',
        description: 'Test product 2 description',
        shortDescription: 'Short description 2',
        price: 200,
        discountPrice: null,
        currency: 'USD',
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
        lastScoreUpdate: new Date().toISOString(),
        purchaseCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        categoryId: 'cat2',
        brandId: null,
        isActive: true,
        isFeatured: true,
        isNewArrival: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod-3',
        name: 'Test Product 3',
        slug: 'test-product-3',
        description: 'Test product 3 description',
        shortDescription: 'Short description 3',
        price: 300,
        discountPrice: 250,
        currency: 'USD',
        images: ['/placeholder-product.jpg'],
        inventory: 15,
        lowStockThreshold: 3,
        sku: 'TP3',
        weight: 1.0,
        dimensions: null,
        metaTitle: 'Test Product 3',
        metaDescription: 'Test product 3 meta description',
        tags: ['test', 'product', 'electronics'],
        viewCount: 0,
        orderCount: 0,
        favoriteCount: 0,
        cartCount: 0,
        popularityScore: 0,
        lastScoreUpdate: new Date().toISOString(),
        purchaseCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        categoryId: 'cat3',
        brandId: null,
        isActive: true,
        isFeatured: false,
        isNewArrival: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
    setTestProducts(products)
  }, [])

  const handleAddProduct = (productIndex: number) => {
    const product = testProducts[productIndex]
    if (!product) return
    
    console.log('=== ADDING PRODUCT ===')
    console.log('Product index:', productIndex)
    console.log('Original product ID:', product.id)
    console.log('Original product name:', product.name)
    
    // Create a deep copy to ensure we're not passing references
    const productCopy = JSON.parse(JSON.stringify(product))
    console.log('Copy product ID:', productCopy.id)
    console.log('Copy product name:', productCopy.name)
    
    // Add to cart
    addItem(productCopy, 1)
    
    setTestCount(testCount + 1)
  }

  const handleAddSameProduct = (productIndex: number) => {
    const product = testProducts[productIndex]
    if (!product) return
    
    console.log('=== ADDING SAME PRODUCT AGAIN ===')
    console.log('Product index:', productIndex)
    console.log('Original product ID:', product.id)
    console.log('Original product name:', product.name)
    
    // Create a deep copy to ensure we're not passing references
    const productCopy = JSON.parse(JSON.stringify(product))
    console.log('Copy product ID:', productCopy.id)
    console.log('Copy product name:', productCopy.name)
    
    // Add to cart
    addItem(productCopy, 1)
  }

  const handleLogCartState = () => {
    console.log('=== CART STATE ===')
    console.log('Items count:', items.length)
    console.log('Total items:', getTotalItems())
    items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        productKeys: Object.keys(item.product)
      })
    })
  }

  const handleClearCart = () => {
    console.log('=== CLEARING CART ===')
    clearCart()
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Cart Comprehensive Debug</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Debug Actions:</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleLogCartState}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Log Cart State
          </button>
          <button 
            onClick={handleClearCart}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Cart
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Test Products:</h3>
        <div className="space-y-2">
          {testProducts.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded">
              <span>{product.name} (ID: {product.id})</span>
              <div className="space-x-2">
                <button 
                  onClick={() => handleAddProduct(index)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => handleAddSameProduct(index)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Again
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-2">Cart Items:</h3>
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-gray-500">Cart is empty</p>
          ) : (
            items.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="flex items-center justify-between p-2 bg-white rounded">
                <span>
                  {item.product.name} (ID: {item.productId}) - Qty: {item.quantity}
                </span>
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
        <p className="mt-2 text-sm text-gray-600">
          Total items in cart: {getTotalItems()}
        </p>
      </div>
    </div>
  )
}