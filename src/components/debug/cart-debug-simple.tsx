'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cart-store'

export default function CartDebugSimple() {
  const { items, addItem, removeItem, clearCart, getTotalItems } = useCartStore()
  const [testCount, setTestCount] = useState(0)

  const handleAddTestProduct = () => {
    const productId = `test-${testCount + 1}`
    const product = {
      id: productId,
      name: `Test Product ${testCount + 1}`,
      slug: `test-product-${testCount + 1}`,
      description: `Test product ${testCount + 1} description`,
      shortDescription: `Short description ${testCount + 1}`,
      price: 100 + testCount * 10,
      discountPrice: null,
      currency: 'USD',
      images: ['/placeholder-product.jpg'],
      inventory: 10,
      lowStockThreshold: 2,
      sku: `TP${testCount + 1}`,
      weight: 1.5,
      dimensions: null,
      metaTitle: `Test Product ${testCount + 1}`,
      metaDescription: `Test product ${testCount + 1} meta description`,
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
    }
    
    console.log('Adding product:', product)
    addItem(product, 1)
    setTestCount(testCount + 1)
  }

  const handleAddSameProduct = () => {
    if (items.length > 0) {
      const lastItem = items[items.length - 1]
      console.log('Adding same product again:', lastItem.product)
      addItem(lastItem.product, 1)
    }
  }

  const handleLogCartState = () => {
    console.log('=== CART STATE ===')
    console.log('Items:', items)
    console.log('Total items:', getTotalItems())
    items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity
      })
    })
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Cart Debug (Simple)</h2>
      
      <div className="mb-4 space-y-2">
        <button 
          onClick={handleAddTestProduct}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add New Test Product
        </button>
        <button 
          onClick={handleAddSameProduct}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Same Product Again
        </button>
        <button 
          onClick={handleLogCartState}
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Log Cart State
        </button>
        <button 
          onClick={clearCart}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Cart
        </button>
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