'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cart-store'
import { Product } from '@/types'

interface CartContextType {
  addToCart: (product: Product, quantity?: number) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCartStore()

  const addToCart = async (product: Product, quantity = 1): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Create a deep copy of the product to avoid reference issues
      const productCopy = JSON.parse(JSON.stringify(product))
      
      // Check product availability
      const response = await fetch(`/api/products/${productCopy.id}`)
      if (!response.ok) {
        throw new Error('Product not found')
      }

      const currentProduct = await response.json()
      
      // Check if product is still active and has sufficient inventory
      if (!currentProduct.isActive) {
        throw new Error('This product is no longer available')
      }

      if (currentProduct.inventory < quantity) {
        throw new Error(`Only ${currentProduct.inventory} items available`)
      }

      // Add to cart
      addItem(currentProduct, quantity)
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <CartContext.Provider value={{ addToCart, isLoading, error }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}