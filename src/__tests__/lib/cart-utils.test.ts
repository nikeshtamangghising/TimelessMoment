import { describe, it, expect } from '@jest/globals'
import {
  calculateCartTotal,
  calculateCartItemsCount,
  formatPrice,
  validateCartItem,
  validateCart,
  getCartSummary,
  mergeCartItems,
  removeOutOfStockItems,
  updateCartItemQuantities
} from '@/lib/cart-utils'

// Simplified product type for testing
type TestProduct = {
  id: string
  name: string
  description: string
  shortDescription?: string
  price: number
  discountPrice?: number | null
  currency: string
  images: string[]
  inventory: number
  lowStockThreshold: number
  sku?: string
  isActive: boolean
  isFeatured?: boolean
  isNewArrival?: boolean
  categoryId: string
  createdAt: Date
  updatedAt: Date
  viewCount?: number
  orderCount?: number
  favoriteCount?: number
  cartCount?: number
  popularityScore?: number
  purchaseCount?: number
  ratingAvg?: number
  ratingCount?: number
}

type TestCartItem = {
  productId: string
  quantity: number
  product: TestProduct
}

const mockProduct1: TestProduct = {
  id: '1',
  name: 'Test Product 1',
  description: 'Description 1',
  shortDescription: 'Short description 1',
  price: 99.99,
  discountPrice: null,
  currency: 'NPR',
  images: ['image1.jpg'],
  inventory: 10,
  lowStockThreshold: 5,
  sku: 'SKU001',
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  categoryId: 'electronics',
  createdAt: new Date(),
  updatedAt: new Date(),
  viewCount: 0,
  orderCount: 0,
  favoriteCount: 0,
  cartCount: 0,
  popularityScore: 0,
  purchaseCount: 0,
  ratingAvg: 0,
  ratingCount: 0,
}

const mockProduct2: TestProduct = {
  id: '2',
  name: 'Test Product 2',
  description: 'Description 2',
  shortDescription: 'Short description 2',
  price: 49.99,
  discountPrice: null,
  currency: 'NPR',
  images: ['image2.jpg'],
  inventory: 5,
  lowStockThreshold: 5,
  sku: 'SKU002',
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  categoryId: 'electronics',
  createdAt: new Date(),
  updatedAt: new Date(),
  viewCount: 0,
  orderCount: 0,
  favoriteCount: 0,
  cartCount: 0,
  popularityScore: 0,
  purchaseCount: 0,
  ratingAvg: 0,
  ratingCount: 0,
}

const mockCartItem1: TestCartItem = {
  productId: '1',
  quantity: 2,
  product: mockProduct1,
}

const mockCartItem2: TestCartItem = {
  productId: '2',
  quantity: 1,
  product: mockProduct2,
}

describe('Cart Utils', () => {
  describe('calculateCartTotal', () => {
    it('should calculate total price correctly', () => {
      const items = [mockCartItem1, mockCartItem2]
      const total = calculateCartTotal(items as any)
      
      // (99.99 * 2) + (49.99 * 1) = 249.97
      expect(total).toBe(249.97)
    })

    it('should return 0 for empty cart', () => {
      expect(calculateCartTotal([] as any)).toBe(0)
    })
  })

  describe('calculateCartItemsCount', () => {
    it('should calculate total items count correctly', () => {
      const items = [mockCartItem1, mockCartItem2]
      const count = calculateCartItemsCount(items as any)
      
      // 2 + 1 = 3
      expect(count).toBe(3)
    })

    it('should return 0 for empty cart', () => {
      expect(calculateCartItemsCount([] as any)).toBe(0)
    })
  })

  describe('formatPrice', () => {
    it('should format price as NPR currency', () => {
      expect(formatPrice(99.99)).toBe('₹ 99.99')
      expect(formatPrice(1234.56)).toBe('₹ 1,234.56')
      expect(formatPrice(0)).toBe('₹ 0.00')
    })
  })

  describe('validateCartItem', () => {
    it('should validate a valid cart item', () => {
      const result = validateCartItem(mockCartItem1 as any)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should invalidate item with zero quantity', () => {
      const invalidItem = { ...mockCartItem1, quantity: 0 }
      const result = validateCartItem(invalidItem as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Quantity must be greater than 0')
    })

    it('should invalidate item with quantity exceeding inventory', () => {
      const invalidItem = { ...mockCartItem1, quantity: 15 }
      const result = validateCartItem(invalidItem as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Only 10 items available')
    })

    it('should invalidate inactive product', () => {
      const inactiveProduct = { ...mockProduct1, isActive: false }
      const invalidItem = { ...mockCartItem1, product: inactiveProduct }
      const result = validateCartItem(invalidItem as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Product is no longer available')
    })
  })

  describe('validateCart', () => {
    it('should validate cart with all valid items', () => {
      const items = [mockCartItem1, mockCartItem2]
      const result = validateCart(items as any)
      
      expect(result.isValid).toBe(true)
      expect(result.validItems).toHaveLength(2)
      expect(result.invalidItems).toHaveLength(0)
    })

    it('should separate valid and invalid items', () => {
      const invalidItem = { ...mockCartItem1, quantity: 0 }
      const items = [mockCartItem2, invalidItem]
      const result = validateCart(items as any)
      
      expect(result.isValid).toBe(false)
      expect(result.validItems).toHaveLength(1)
      expect(result.invalidItems).toHaveLength(1)
    })
  })

  describe('getCartSummary', () => {
    it('should calculate cart summary with shipping', () => {
      const items = [mockCartItem2] // NPR 49.99 total
      const summary = getCartSummary(items as any)
      
      expect(summary.subtotal).toBe(49.99)
      expect(summary.shipping).toBe(200) // Under NPR 200, so shipping applies
      expect(summary.tax).toBeCloseTo(6.5, 2) // 13% of subtotal
      expect(summary.total).toBeCloseTo(256.49, 2)
      expect(summary.itemsCount).toBe(1)
      expect(summary.freeShippingRemaining).toBeCloseTo(150.01, 2)
    })

    it('should calculate cart summary with free shipping', () => {
      const items = [mockCartItem1] // NPR 199.98 total
      const summary = getCartSummary(items as any)
      
      expect(summary.subtotal).toBe(199.98)
      expect(summary.shipping).toBe(200) // Under free shipping threshold
      expect(summary.tax).toBeCloseTo(26, 2) // 13% of subtotal
      expect(summary.total).toBeCloseTo(425.98, 2)
      expect(summary.freeShippingRemaining).toBeCloseTo(0.02, 2)
    })
  })

  describe('mergeCartItems', () => {
    it('should merge items with same product ID', () => {
      const existing = [mockCartItem1] // quantity: 2
      const newItems = [{ ...mockCartItem1, quantity: 1 }] // quantity: 1
      
      const merged = mergeCartItems(existing as any, newItems as any)
      
      expect(merged).toHaveLength(1)
      expect(merged[0].quantity).toBe(3) // 2 + 1
    })

    it('should add new items with different product IDs', () => {
      const existing = [mockCartItem1]
      const newItems = [mockCartItem2]
      
      const merged = mergeCartItems(existing as any, newItems as any)
      
      expect(merged).toHaveLength(2)
      expect(merged.find(item => item.productId === '1')?.quantity).toBe(2)
      expect(merged.find(item => item.productId === '2')?.quantity).toBe(1)
    })
  })

  describe('removeOutOfStockItems', () => {
    it('should remove inactive products', () => {
      const inactiveProduct = { ...mockProduct1, isActive: false }
      const inactiveItem = { ...mockCartItem1, product: inactiveProduct }
      const items = [mockCartItem2, inactiveItem]
      
      const filtered = removeOutOfStockItems(items as any)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].productId).toBe('2')
    })

    it('should remove items with zero inventory', () => {
      const outOfStockProduct = { ...mockProduct1, inventory: 0 }
      const outOfStockItem = { ...mockCartItem1, product: outOfStockProduct }
      const items = [mockCartItem2, outOfStockItem]
      
      const filtered = removeOutOfStockItems(items as any)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].productId).toBe('2')
    })

    it('should remove items with quantity exceeding inventory', () => {
      const limitedProduct = { ...mockProduct1, inventory: 1 }
      const excessiveItem = { ...mockCartItem1, product: limitedProduct, quantity: 5 }
      const items = [mockCartItem2, excessiveItem]
      
      const filtered = removeOutOfStockItems(items as any)
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].productId).toBe('2')
    })
  })

  describe('updateCartItemQuantities', () => {
    it('should limit quantities to available inventory', () => {
      const limitedProduct = { ...mockProduct1, inventory: 1 }
      const excessiveItem = { ...mockCartItem1, product: limitedProduct, quantity: 5 }
      const items = [mockCartItem2, excessiveItem]
      
      const updated = updateCartItemQuantities(items as any)
      
      expect(updated).toHaveLength(2)
      expect(updated.find(item => item.productId === '1')?.quantity).toBe(1)
      expect(updated.find(item => item.productId === '2')?.quantity).toBe(1)
    })

    it('should remove items with zero inventory', () => {
      const outOfStockProduct = { ...mockProduct1, inventory: 0 }
      const outOfStockItem = { ...mockCartItem1, product: outOfStockProduct }
      const items = [mockCartItem2, outOfStockItem]
      
      const updated = updateCartItemQuantities(items as any)
      
      expect(updated).toHaveLength(1)
      expect(updated[0].productId).toBe('2')
    })
  })
})