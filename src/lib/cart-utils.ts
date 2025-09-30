import { CartItem } from '@/types'

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    return total + (item.product.price * item.quantity)
  }, 0)
}

export function calculateCartItemsCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function validateCartItem(item: CartItem): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!item.product) {
    errors.push('Product information is missing')
  }

  if (item.quantity <= 0) {
    errors.push('Quantity must be greater than 0')
  }

  if (item.product && item.quantity > item.product.inventory) {
    errors.push(`Only ${item.product.inventory} items available`)
  }

  if (item.product && !item.product.isActive) {
    errors.push('Product is no longer available')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateCart(items: CartItem[]): {
  isValid: boolean
  errors: string[]
  validItems: CartItem[]
  invalidItems: CartItem[]
} {
  const validItems: CartItem[] = []
  const invalidItems: CartItem[] = []
  const allErrors: string[] = []

  items.forEach(item => {
    const validation = validateCartItem(item)
    if (validation.isValid) {
      validItems.push(item)
    } else {
      invalidItems.push(item)
      allErrors.push(...validation.errors)
    }
  })

  return {
    isValid: invalidItems.length === 0,
    errors: allErrors,
    validItems,
    invalidItems
  }
}

export function getCartSummary(items: CartItem[]) {
  const subtotal = calculateCartTotal(items)
  const itemsCount = calculateCartItemsCount(items)
  
  // Calculate shipping (free over $50)
  const shipping = subtotal >= 50 ? 0 : 9.99
  
  // Calculate tax (8.5%)
  const tax = subtotal * 0.085
  
  const total = subtotal + shipping + tax

  return {
    subtotal,
    shipping,
    tax,
    total,
    itemsCount,
    freeShippingThreshold: 50,
    freeShippingRemaining: Math.max(0, 50 - subtotal)
  }
}

export function mergeCartItems(existingItems: CartItem[], newItems: CartItem[]): CartItem[] {
  const merged = [...existingItems]

  newItems.forEach(newItem => {
    const existingIndex = merged.findIndex(item => item.productId === newItem.productId)
    
    if (existingIndex >= 0) {
      // Update quantity of existing item
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: merged[existingIndex].quantity + newItem.quantity
      }
    } else {
      // Add new item
      merged.push(newItem)
    }
  })

  return merged
}

export function removeOutOfStockItems(items: CartItem[]): CartItem[] {
  return items.filter(item => 
    item.product.isActive && 
    item.product.inventory > 0 &&
    item.quantity <= item.product.inventory
  )
}

export function updateCartItemQuantities(items: CartItem[]): CartItem[] {
  return items.map(item => ({
    ...item,
    quantity: Math.min(item.quantity, item.product.inventory)
  })).filter(item => item.quantity > 0)
}