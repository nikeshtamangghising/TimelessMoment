import { describe, it, expect } from '@jest/globals'
import { 
  createProductSchema, 
  updateProductSchema,
  productFiltersSchema,
  CreateProductInput 
} from '@/lib/validations'

describe('Product Validation', () => {
  describe('createProductSchema', () => {
    const validProductData: CreateProductInput = {
      name: 'Test Product',
      description: 'This is a test product',
      price: 99.99,
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      inventory: 50,
      category: 'Electronics',
      slug: 'test-product',
      isActive: true,
    }

    it('should validate a valid product', () => {
      const result = createProductSchema.safeParse(validProductData)
      expect(result.success).toBe(true)
    })

    it('should require name', () => {
      const invalidData = { ...validProductData, name: '' }
      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product name is required')
      }
    })

    it('should require description', () => {
      const invalidData = { ...validProductData, description: '' }
      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Product description is required')
      }
    })

    it('should require positive price', () => {
      const invalidData = { ...validProductData, price: -10 }
      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Price must be positive')
      }
    })

    it('should validate image URLs', () => {
      const invalidData = { ...validProductData, images: ['not-a-url'] }
      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid image URL')
      }
    })

    it('should require non-negative inventory', () => {
      const invalidData = { ...validProductData, inventory: -5 }
      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Inventory cannot be negative')
      }
    })

    it('should validate slug format', () => {
      const invalidData = { ...validProductData, slug: 'Invalid Slug!' }
      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Slug must contain only lowercase letters, numbers, and hyphens')
      }
    })

    it('should accept valid slug formats', () => {
      const validSlugs = ['test-product', 'product123', 'my-awesome-product-2024']
      
      validSlugs.forEach(slug => {
        const data = { ...validProductData, slug }
        const result = createProductSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should default isActive to true', () => {
      const dataWithoutIsActive = { ...validProductData }
      delete (dataWithoutIsActive as any).isActive
      
      const result = createProductSchema.safeParse(dataWithoutIsActive)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(true)
      }
    })
  })

  describe('updateProductSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
        price: 149.99,
      }

      const result = updateProductSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate fields when provided', () => {
      const invalidUpdate = {
        price: -50,
        inventory: -10,
      }

      const result = updateProductSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })

    it('should allow empty updates', () => {
      const result = updateProductSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('productFiltersSchema', () => {
    it('should validate valid filters', () => {
      const filters = {
        category: 'Electronics',
        minPrice: 10,
        maxPrice: 500,
        search: 'laptop',
        isActive: true,
      }

      const result = productFiltersSchema.safeParse(filters)
      expect(result.success).toBe(true)
    })

    it('should allow empty filters', () => {
      const result = productFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate price ranges', () => {
      const invalidFilters = {
        minPrice: -10,
        maxPrice: -5,
      }

      const result = productFiltersSchema.safeParse(invalidFilters)
      expect(result.success).toBe(false)
    })

    it('should allow optional fields', () => {
      const partialFilters = {
        category: 'Books',
        search: 'fiction',
      }

      const result = productFiltersSchema.safeParse(partialFilters)
      expect(result.success).toBe(true)
    })
  })
})