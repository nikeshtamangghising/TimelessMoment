'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/stores/cart-store'
import { CartItem as CartItemType } from '@/types'
import { formatPrice } from '@/lib/cart-utils'
import Button from '@/components/ui/button'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0) return
    
    setIsUpdating(true)
    
    try {
      if (newQuantity === 0) {
        removeItem(item.productId)
      } else {
        // Check if quantity exceeds inventory
        if (newQuantity > item.product.inventory) {
          alert(`Only ${item.product.inventory} items available`)
          return
        }
        updateQuantity(item.productId, newQuantity)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = () => {
    removeItem(item.productId)
  }

  const itemTotal = item.product.price * item.quantity

  return (
    <div className="flex items-center space-x-4">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <Link href={`/products/${item.product.slug}`}>
          <Image
            src={item.product.images[0] || '/placeholder-product.jpg'}
            alt={item.product.name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-md object-cover object-center hover:opacity-75 transition-opacity"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              <Link 
                href={`/products/${item.product.slug}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {item.product.name}
              </Link>
            </h3>
            
            <p className="mt-1 text-sm text-gray-500">
              {item.product.category?.name || 'Uncategorized'}
            </p>
            
            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatPrice(item.product.price)}
            </p>

            {/* Inventory Warning */}
            {item.product.inventory <= 5 && (
              <p className="mt-1 text-xs text-orange-600">
                Only {item.product.inventory} left in stock
              </p>
            )}
          </div>

          {/* Remove Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Remove item"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            
            <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
              {item.quantity}
            </span>
            
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= item.product.inventory}
              className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Item Total */}
          <div className="text-sm font-medium text-gray-900">
            {formatPrice(itemTotal)}
          </div>
        </div>
      </div>
    </div>
  )
}