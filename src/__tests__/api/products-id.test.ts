import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/products/[id]/route'

// Mock the product repository
const mockProductRepository = {
  findById: jest.fn(),
  findBySlug: jest.fn(),
  update: jest.fn(),
}

jest.mock('@/lib/product-repository', () => ({
  productRepository: mockProductRepository,
}))

// Mock auth middleware
jest.mock('@/lib/auth-middleware', () => ({
  createAdminHandler: (handler: any) => handler,
}))

describe('/api/products/[id]', () => {
  const mockParams = { params: { id: '1' } }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/products/[id]', () => {
    it('should return a product by id', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        slug: 'test-product',
      }

      mockProductRepository.findById.mockResolvedValue(mockProduct)

      const request = new NextRequest('http://localhost:3000/api/products/1')
      const response = await GET(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProduct)
      expect(mockProductRepository.findById).toHaveBeenCalledWith('1')
    })

    it('should return 404 if product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/999')
      const response = await GET(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Product not found')
    })
  })

  describe('PUT /api/products/[id]', () => {
    it('should update a product successfully', async () => {
      const existingProduct = {
        id: '1',
        name: 'Old Product',
        slug: 'old-product',
      }

      const updateData = {
        name: 'Updated Product',
        price: 149.99,
      }

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
      }

      mockProductRepository.findById.mockResolvedValue(existingProduct)
      mockProductRepository.update.mockResolvedValue(updatedProduct)

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Product updated successfully')
      expect(data.product).toEqual(updatedProduct)
    })

    it('should return 404 if product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/999', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Product not found')
    })

    it('should return 400 for slug conflict', async () => {
      const existingProduct = {
        id: '1',
        name: 'Product 1',
        slug: 'product-1',
      }

      const conflictingProduct = {
        id: '2',
        slug: 'existing-slug',
      }

      mockProductRepository.findById.mockResolvedValue(existingProduct)
      mockProductRepository.findBySlug.mockResolvedValue(conflictingProduct)

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'PUT',
        body: JSON.stringify({ slug: 'existing-slug' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('A product with this slug already exists')
    })
  })

  describe('DELETE /api/products/[id]', () => {
    it('should soft delete a product', async () => {
      const existingProduct = {
        id: '1',
        name: 'Product to Delete',
        isActive: true,
      }

      const deletedProduct = {
        ...existingProduct,
        isActive: false,
      }

      mockProductRepository.findById.mockResolvedValue(existingProduct)
      mockProductRepository.update.mockResolvedValue(deletedProduct)

      const request = new NextRequest('http://localhost:3000/api/products/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Product deleted successfully')
      expect(mockProductRepository.update).toHaveBeenCalledWith('1', { isActive: false })
    })

    it('should return 404 if product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/products/999', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Product not found')
    })
  })
})