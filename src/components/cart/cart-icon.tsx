'use client'

import { useState, useEffect } from 'react'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/stores/cart-store'

export default function CartIcon() {
  const { getTotalItems, openCart } = useCartStore()
  const [isClient, setIsClient] = useState(false)

  // Only show cart count after hydration to prevent mismatches
  useEffect(() => {
    setIsClient(true)
  }, [])

  const itemCount = isClient ? getTotalItems() : 0

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCartIcon className="h-6 w-6" />
      
      {isClient && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  )
}
