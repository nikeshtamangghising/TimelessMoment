'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cart-store'

export default function CartReferenceDebug() {
  const { items, addItem, removeItem, clearCart, getTotalItems } = useCartStore()
  const [testCount, setTestCount] = useState(1)

  const handleAddProduct = (productNumber: number) => {
    const product = {
      id: `test-${productNumber}`,
      name: `Test Product ${productNumber}`,
      slug: `test-product-${productNumber}`,
      description: `Test product ${productNumber} description`,
      shortDescription: `Short description ${productNumber}`,
      price: 100 + productNumber * 10,
      discountPrice: null,
      currency: 'USD',
      images: ['/placeholder-product.jpg'],
      inventory: 10,
      lowStockThreshold: 2,
      sku: `TP${productNumber}`,
      weight: 1.5,
      dimensions: null,
      metaTitle: `Test Product ${productNumber}`,
      metaDescription: `Test product ${productNumber} meta description`,
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
    }
    
    console.log('=== ADDING PRODUCT ===')
    console.log('Original product ID:', product.id)
    console.log('Original product name:', product.name)
    
    // Create a deep copy to ensure we're not passing references
    const productCopy1 = JSON.parse(JSON.stringify(product))
    console.log('Copy 1 product ID:', productCopy1.id)
    console.log('Copy 1 product name:', productCopy1.name)
    
    // Add to cart
    addItem(productCopy1, 1)
    
    setTestCount(testCount + 1)
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
      <h2 className="text-xl font-bold mb-4">Cart Reference Debug</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Debug Actions:</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleAddProduct(testCount)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Product {testCount}
          </button>
          <button 
            onClick={() => handleAddProduct(testCount + 1)}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Product {testCount + 1}
          </button>
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