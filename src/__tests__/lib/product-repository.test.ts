import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { ProductRepository } from '@/lib/product-repository'
import { CreateProductInput, UpdateProductInput } from '@/lib/validations'

// Mock Prisma
const mockPrisma = {
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

describe('ProductRepository', () => {
  let repository: ProductRepository

  beforeEach(() => {
    repository = new ProductRepository()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('create', () => {
    it('should create a product successfully', async () => {
      const productData: CreateProductInput = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        images: ['https://example.com/image.jpg'],
        inventory: 10,
        category: 'Electronics',
        slug: 'test-product',
        isActive: true,
      }

      const expectedProduct = {
        id: '1',
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.product.create.mockResolvedValue(expectedProduct)

      const result = await repository.create(productData)

      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: productData,
      })
      expect(result).toEqual(expectedProduct)
    })
  })

  describe('findById', () => {
    it('should find a product by id', async () => {
      const productId = '1'
      const expectedProduct = {
        id: productId,
        name: 'Test Product',
        slug: 'test-product',
      }

      mockPrisma.product.findUnique.mockResolvedValue(expectedProduct)

      const result = await repository.findById(productId)

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: productId },
      })
      expect(result).toEqual(expectedProduct)
    })

    it('should return null if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('should find a product by slug', async () => {
      const slug = 'test-product'
      const expectedProduct = {
        id: '1',
        name: 'Test Product',
        slug,
      }

      mockPrisma.product.findUnique.mockResolvedValue(expectedProduct)

      const result = await repository.findBySlug(slug)

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug },
      })
      expect(result).toEqual(expectedProduct)
    })
  })

  describe('findMany', () => {
    it('should return paginated products', async () => {
      const products = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ]
      const totalCount = 2

      mockPrisma.product.findMany.mockResolvedValue(products)
      mockPrisma.product.count.mockResolvedValue(totalCount)

      const result = await repository.findMany({}, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: products,
        pagination: {
          page: 1,
          limit: 10,
          total: totalCount,
          totalPages: 1,
        },
      })
    })

    it('should apply search filters', async () => {
      const filters = { search: 'test', category: 'Electronics' }
      
      mockPrisma.product.findMany.mockResolvedValue([])
      mockPrisma.product.count.mockResolvedValue(0)

      await repository.findMany(filters)

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          category: 'Electronics',
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('update', () => {
    it('should update a product', async () => {
      const productId = '1'
      const updateData: UpdateProductInput = {
        name: 'Updated Product',
        price: 149.99,
      }

      const updatedProduct = {
        id: productId,
        ...updateData,
      }

      mockPrisma.product.update.mockResolvedValue(updatedProduct)

      const result = await repository.update(productId, updateData)

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: updateData,
      })
      expect(result).toEqual(updatedProduct)
    })
  })

  describe('checkAvailability', () => {
    it('should return true if product is available', async () => {
      const productId = '1'
      const quantity = 5

      mockPrisma.product.findUnique.mockResolvedValue({
        inventory: 10,
        isActive: true,
      })

      const result = await repository.checkAvailability(productId, quantity)

      expect(result).toBe(true)
    })

    it('should return false if insufficient inventory', async () => {
      const productId = '1'
      const quantity = 15

      mockPrisma.product.findUnique.mockResolvedValue({
        inventory: 10,
        isActive: true,
      })

      const result = await repository.checkAvailability(productId, quantity)

      expect(result).toBe(false)
    })

    it('should return false if product is inactive', async () => {
      const productId = '1'
      const quantity = 5

      mockPrisma.product.findUnique.mockResolvedValue({
        inventory: 10,
        isActive: false,
      })

      const result = await repository.checkAvailability(productId, quantity)

      expect(result).toBe(false)
    })
  })

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      const categories = [
        { category: 'Electronics' },
        { category: 'Clothing' },
        { category: 'Books' },
      ]

      mockPrisma.product.findMany.mockResolvedValue(categories)

      const result = await repository.getCategories()

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        select: { category: true },
        distinct: ['category'],
        where: { isActive: true },
      })
      expect(result).toEqual(['Electronics', 'Clothing', 'Books'])
    })
  })
})