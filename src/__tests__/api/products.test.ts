import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/products/route'

// Mock the product repository
const mockProductRepository = {
  findMany: jest.fn(),
  create: jest.fn(),
  findBySlug: jest.fn(),
}

jest.mock('@/lib/product-repository', () => ({
  productRepository: mockProductRepository,
}))

// Mock auth middleware
jest.mock('@/lib/auth-middleware', () => ({
  createAdminHandler: (handler: any) => handler,
}))

describe('/api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const mockProducts = {
        data: [
          { id: '1', name: 'Product 1', price: 99.99 },
          { id: '2', name: 'Product 2', price: 149.99 },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      }

      mockProductRepository.findMany.mockResolvedValue(mockProducts)

      const request = new NextRequest('http://localhost:3000/api/products')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProducts)
      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 1, limit: 10 }
      )
    })

    it('should handle search and filter parameters', async () => {
      mockProductRepository.findMany.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      })

      const url = 'http://localhost:3000/api/products?search=laptop&category=Electronics&minPrice=100&maxPrice=500&page=2&limit=5'
      const request = new NextRequest(url)
      await GET(request)

      expect(mockProductRepository.findMany).toHaveBeenCalledWith(
        {
          search: 'laptop',
          category: 'Electronics',
          minPrice: 100,
          maxPrice: 500,
          isActive: undefined,
        },
        { page: 2, limit: 5 }
      )
    })

    it('should return 400 for invalid pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/products?page=0&limit=-5')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid pagination parameters')
    })
  })

  describe('POST /api/products', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'New Product',
        description: 'A great product',
        price: 99.99,
        images: ['https://example.com/image.jpg'],
        inventory: 50,
        category: 'Electronics',
        slug: 'new-product',
        isActive: true,
      }

      const createdProduct = {
        id: '1',
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockProductRepository.findBySlug.mockResolvedValue(null)
      mockProductRepository.create.mockResolvedValue(createdProduct)

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Product created successfully')
      expect(data.product).toEqual(createdProduct)
    })

    it('should return 400 for invalid product data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        price: -10, // Invalid: negative price
      }

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should return 400 for duplicate slug', async () => {
      const productData = {
        name: 'New Product',
        description: 'A great product',
        price: 99.99,
        images: ['https://example.com/image.jpg'],
        inventory: 50,
        category: 'Electronics',
        slug: 'existing-product',
        isActive: true,
      }

      mockProductRepository.findBySlug.mockResolvedValue({ id: '1', slug: 'existing-product' })

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('A product with this slug already exists')
    })
  })
})