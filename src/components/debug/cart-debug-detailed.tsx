'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { Product } from '@/types'

export default function CartDebugDetailed() {
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
      },
      {
        id: '3',
        name: 'Test Product 3',
        slug: 'test-product-3',
        description: 'Test product 3 description',
        shortDescription: 'Short description 3',
        price: 300,
        discountPrice: 250,
        currency: 'NPR',
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
        lastScoreUpdate: new Date(),
        purchaseCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        categoryId: 'cat3',
        brandId: null,
        isActive: true,
        isFeatured: false,
        isNewArrival: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]
    setTestProducts(products)
  }, [])

  const handleAddProduct = (product: Product) => {
    console.log('=== ADDING PRODUCT ===')
    console.log('Product ID:', product.id)
    console.log('Product Name:', product.name)
    console.log('Product Object:', JSON.stringify(product, null, 2))
    
    // Check if product already exists in cart
    const existingItem = items.find(item => item.productId === product.id)
    console.log('Existing item in cart:', existingItem)
    
    addItem(product, 1)
    
    // Log the cart state after adding
    setTimeout(() => {
      const updatedItems = useCartStore.getState().items
      console.log('Cart items after adding:', updatedItems)
    }, 0)
  }

  const handleClearCart = () => {
    console.log('=== CLEARING CART ===')
    clearCart()
    console.log('Cart cleared')
  }

  const handleLogCartState = () => {
    console.log('=== CURRENT CART STATE ===')
    console.log('Cart items:', items)
    console.log('Cart items count:', items.length)
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
      <h2 className="text-xl font-bold mb-4">Cart Debug (Detailed)</h2>
      
      <div className="mb-4">
        <div className="flex space-x-2 mb-4">
          <button 
            onClick={handleLogCartState}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
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
                <div className="space-x-2">
                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                  <button 
                    onClick={() => addItem(item.product, 1)}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Add More
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Total items in cart: {items.reduce((total, item) => total + item.quantity, 0)}
        </p>
      </div>
    </div>
  )
}