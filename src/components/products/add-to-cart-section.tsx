'use client'

import { useState } from 'react'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { useCartStore } from '@/stores/cart-store'
import { Product } from '@/types'

interface AddToCartSectionProps {
  product: Product
}

export default function AddToCartSection({ product }: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart, isLoading } = useCart()
  const { openCart } = useCartStore()

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.inventory) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = async () => {
    const success = await addToCart(product, quantity)
    if (success) {
      openCart()
      // Reset quantity to 1 after successful add
      setQuantity(1)
    }
  }

  const isOutOfStock = product.inventory === 0
  const isMaxQuantity = quantity >= product.inventory
  const isMinQuantity = quantity <= 1

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-md">
          <button 
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={isMinQuantity || isLoading}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <input
            type="number"
            min="1"
            max={product.inventory}
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            disabled={isLoading}
            className="w-16 px-2 py-2 text-center border-0 focus:ring-0 disabled:opacity-50"
          />
          <button 
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={isMaxQuantity || isLoading}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        
        {/* Stock Info */}
        <div className="text-sm text-gray-600">
          {product.inventory <= 5 && product.inventory > 0 && (
            <span className="text-orange-600">Only {product.inventory} left!</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          size="lg"
          disabled={isOutOfStock || isLoading}
          onClick={handleAddToCart}
          className="flex-1"
        >
          {isLoading ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={isLoading}
        >
          ♡ Wishlist
        </Button>
      </div>
      
      {/* Inventory Warning */}
      {isOutOfStock && (
        <p className="text-sm text-red-600">
          This item is currently out of stock. Please check back later.
        </p>
      )}
    </div>
  )
}
