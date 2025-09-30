import {
  createUserSchema,
  createProductSchema,
  updateProductSchema,
  createOrderSchema,
  updateOrderSchema,
  paginationSchema,
  productFiltersSchema,
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      }

      const result = createUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
        expect(result.data.name).toBe('Test User')
        expect(result.data.role).toBe('CUSTOMER')
      }
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      }

      const result = createUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('should reject empty name', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: '',
        role: 'CUSTOMER' as const,
      }

      const result = createUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('should reject invalid role', () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'INVALID_ROLE' as any,
      }

      const result = createUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('role')
      }
    })

    it('should use default role when not provided', () => {
      const userWithoutRole = {
        email: 'test@example.com',
        name: 'Test User',
      }

      const result = createUserSchema.safeParse(userWithoutRole)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('CUSTOMER')
      }
    })
  })

  describe('createProductSchema', () => {
    it('should validate valid product data', () => {
      const validProduct = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        category: 'Electronics',
        imageUrl: 'https://example.com/image.jpg',
        stock: 10,
      }

      const result = createProductSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Product')
        expect(result.data.price).toBe(99.99)
        expect(result.data.stock).toBe(10)
      }
    })

    it('should reject negative price', () => {
      const invalidProduct = {
        name: 'Test Product',
        description: 'A test product',
        price: -10,
        category: 'Electronics',
        stock: 10,
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('price')
      }
    })

    it('should reject negative stock', () => {
      const invalidProduct = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        category: 'Electronics',
        stock: -5,
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('stock')
      }
    })

    it('should reject empty name', () => {
      const invalidProduct = {
        name: '',
        description: 'A test product',
        price: 99.99,
        category: 'Electronics',
        stock: 10,
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('should reject invalid URL format', () => {
      const invalidProduct = {
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        category: 'Electronics',
        imageUrl: 'not-a-url',
        stock: 10,
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('imageUrl')
      }
    })

    it('should allow optional fields to be undefined', () => {
      const minimalProduct = {
        name: 'Test Product',
        price: 99.99,
        category: 'Electronics',
        stock: 10,
      }

      const result = createProductSchema.safeParse(minimalProduct)
      expect(result.success).toBe(true)
    })
  })

  describe('updateProductSchema', () => {
    it('should validate partial product updates', () => {
      const partialUpdate = {
        name: 'Updated Product',
        price: 149.99,
      }

      const result = updateProductSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Updated Product')
        expect(result.data.price).toBe(149.99)
      }
    })

    it('should allow empty updates', () => {
      const emptyUpdate = {}

      const result = updateProductSchema.safeParse(emptyUpdate)
      expect(result.success).toBe(true)
    })

    it('should reject invalid values in partial updates', () => {
      const invalidUpdate = {
        price: -50,
      }

      const result = updateProductSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('price')
      }
    })
  })

  describe('createOrderSchema', () => {
    it('should validate valid order data', () => {
      const validOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 99.99,
          },
        ],
        total: 199.98,
        stripePaymentIntentId: 'pi_test_123',
      }

      const result = createOrderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe('user-123')
        expect(result.data.items).toHaveLength(1)
        expect(result.data.total).toBe(199.98)
      }
    })

    it('should reject empty items array', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [],
        total: 0,
      }

      const result = createOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('items')
      }
    })

    it('should reject negative quantities', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 'product-1',
            quantity: -1,
            price: 99.99,
          },
        ],
        total: 99.99,
      }

      const result = createOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('quantity')
      }
    })

    it('should reject negative prices', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: -99.99,
          },
        ],
        total: 99.99,
      }

      const result = createOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('price')
      }
    })

    it('should reject negative total', () => {
      const invalidOrder = {
        userId: 'user-123',
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 99.99,
          },
        ],
        total: -99.99,
      }

      const result = createOrderSchema.safeParse(invalidOrder)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('total')
      }
    })
  })

  describe('updateOrderSchema', () => {
    it('should validate valid status updates', () => {
      const validUpdate = {
        status: 'SHIPPED' as const,
      }

      const result = updateOrderSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('SHIPPED')
      }
    })

    it('should reject invalid status', () => {
      const invalidUpdate = {
        status: 'INVALID_STATUS' as any,
      }

      const result = updateOrderSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })

    it('should allow empty updates', () => {
      const emptyUpdate = {}

      const result = updateOrderSchema.safeParse(emptyUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe('paginationSchema', () => {
    it('should validate valid pagination parameters', () => {
      const validPagination = {
        page: 2,
        limit: 20,
      }

      const result = paginationSchema.safeParse(validPagination)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should use default values', () => {
      const emptyPagination = {}

      const result = paginationSchema.safeParse(emptyPagination)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
      }
    })

    it('should reject negative page numbers', () => {
      const invalidPagination = {
        page: -1,
        limit: 10,
      }

      const result = paginationSchema.safeParse(invalidPagination)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('page')
      }
    })

    it('should reject zero page numbers', () => {
      const invalidPagination = {
        page: 0,
        limit: 10,
      }

      const result = paginationSchema.safeParse(invalidPagination)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('page')
      }
    })

    it('should reject excessive limit values', () => {
      const invalidPagination = {
        page: 1,
        limit: 1000,
      }

      const result = paginationSchema.safeParse(invalidPagination)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('limit')
      }
    })
  })

  describe('productFiltersSchema', () => {
    it('should validate valid filter parameters', () => {
      const validFilters = {
        category: 'Electronics',
        search: 'iPhone',
        minPrice: 100,
        maxPrice: 1000,
        isActive: true,
      }

      const result = productFiltersSchema.safeParse(validFilters)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe('Electronics')
        expect(result.data.search).toBe('iPhone')
        expect(result.data.minPrice).toBe(100)
        expect(result.data.maxPrice).toBe(1000)
        expect(result.data.isActive).toBe(true)
      }
    })

    it('should allow empty filters', () => {
      const emptyFilters = {}

      const result = productFiltersSchema.safeParse(emptyFilters)
      expect(result.success).toBe(true)
    })

    it('should reject negative prices', () => {
      const invalidFilters = {
        minPrice: -10,
      }

      const result = productFiltersSchema.safeParse(invalidFilters)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('minPrice')
      }
    })

    it('should reject invalid boolean values', () => {
      const invalidFilters = {
        isActive: 'true' as any, // Should be boolean, not string
      }

      const result = productFiltersSchema.safeParse(invalidFilters)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('isActive')
      }
    })

    it('should handle string numbers for prices', () => {
      const filtersWithStringNumbers = {
        minPrice: '100',
        maxPrice: '1000',
      }

      const result = productFiltersSchema.safeParse(filtersWithStringNumbers)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.minPrice).toBe(100)
        expect(result.data.maxPrice).toBe(1000)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const nullData = null

      const result = createUserSchema.safeParse(nullData)
      expect(result.success).toBe(false)
    })

    it('should handle undefined values', () => {
      const undefinedData = undefined

      const result = createUserSchema.safeParse(undefinedData)
      expect(result.success).toBe(false)
    })

    it('should handle non-object values', () => {
      const stringData = 'not an object'

      const result = createUserSchema.safeParse(stringData)
      expect(result.success).toBe(false)
    })

    it('should handle arrays instead of objects', () => {
      const arrayData = ['not', 'an', 'object']

      const result = createUserSchema.safeParse(arrayData)
      expect(result.success).toBe(false)
    })
  })

  describe('Type Safety', () => {
    it('should provide correct TypeScript types', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      }

      const result = createUserSchema.safeParse(validUser)
      if (result.success) {
        // These should not cause TypeScript errors
        const email: string = result.data.email
        const name: string = result.data.name
        const role: 'CUSTOMER' | 'ADMIN' = result.data.role

        expect(email).toBe('test@example.com')
        expect(name).toBe('Test User')
        expect(role).toBe('CUSTOMER')
      }
    })
  })
})