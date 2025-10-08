import { CartItem } from '@/types'
import { formatCurrency, getFreeShippingThreshold, DEFAULT_CURRENCY } from './currency'
import { SettingsRepository } from './settings-repository'

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const price = item.product.discountPrice || item.product.price
    return total + (price * item.quantity)
  }, 0)
}

export function calculateCartItemsCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function formatPrice(price: number, currency: string = DEFAULT_CURRENCY): string {
  return formatCurrency(price, currency)
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
  
  // Get free shipping threshold for NPR
  const freeShippingThreshold = getFreeShippingThreshold(DEFAULT_CURRENCY)
  
  // Calculate shipping (free over NPR 200)
  const shipping = subtotal >= freeShippingThreshold ? 0 : 200 // NPR 200 for shipping
  
  // Calculate tax (13% VAT for Nepal)
  const tax = subtotal * 0.13
  
  const total = subtotal + shipping + tax

  return {
    subtotal,
    shipping,
    tax,
    total,
    itemsCount,
    freeShippingThreshold,
    freeShippingRemaining: Math.max(0, freeShippingThreshold - subtotal)
  }
}

// Async version that uses configurable settings from the database
// This ensures shipping costs and thresholds are always synced with admin settings
export async function getCartSummaryWithSettings(items: CartItem[]) {
  const subtotal = calculateCartTotal(items)
  const itemsCount = calculateCartItemsCount(items)
  
  // Get configurable settings
  const freeShippingThreshold = await SettingsRepository.getValue('free_shipping_threshold', 200)
  const shippingRate = await SettingsRepository.getValue('shipping_rate', 200)
  const taxRate = await SettingsRepository.getValue('tax_rate', 0.13)
  
  // Calculate shipping
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingRate
  
  // Calculate tax
  const tax = subtotal * taxRate
  
  const total = subtotal + shipping + tax

  return {
    subtotal,
    shipping,
    tax,
    total,
    itemsCount,
    freeShippingThreshold,
    freeShippingRemaining: Math.max(0, freeShippingThreshold - subtotal),
    taxRate,
    shippingRate
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