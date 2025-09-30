import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { OrderRepository } from '@/lib/order-repository'
import { CreateOrderInput } from '@/lib/validations'

// Mock Prisma
const mockPrisma = {
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  orderItem: {
    deleteMany: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}))

describe('OrderRepository', () => {
  let repository: OrderRepository

  beforeEach(() => {
    repository = new OrderRepository()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('create', () => {
    it('should create an order successfully', async () => {
      const orderData: CreateOrderInput = {
        userId: 'user123',
        items: [
          { productId: 'product1', quantity: 2, price: 99.99 },
          { productId: 'product2', quantity: 1, price: 49.99 },
        ],
        total: 249.97,
        stripePaymentIntentId: 'pi_test123',
      }

      const expectedOrder = {
        id: 'order123',
        ...orderData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        user: { id: 'user123', name: 'Test User' },
      }

      mockPrisma.order.create.mockResolvedValue(expectedOrder)

      const result = await repository.create(orderData)

      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: {
          userId: orderData.userId,
          total: orderData.total,
          stripePaymentIntentId: orderData.stripePaymentIntentId,
          status: 'PENDING',
          items: {
            create: orderData.items,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      })
      expect(result).toEqual(expectedOrder)
    })
  })

  describe('findById', () => {
    it('should find an order by id', async () => {
      const orderId = 'order123'
      const expectedOrder = {
        id: orderId,
        userId: 'user123',
        total: 99.99,
        status: 'PAID',
        items: [],
        user: { id: 'user123', name: 'Test User' },
      }

      mockPrisma.order.findUnique.mockResolvedValue(expectedOrder)

      const result = await repository.findById(orderId)

      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      })
      expect(result).toEqual(expectedOrder)
    })

    it('should return null if order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should return paginated orders for a user', async () => {
      const userId = 'user123'
      const orders = [
        { id: 'order1', userId, total: 99.99 },
        { id: 'order2', userId, total: 149.99 },
      ]
      const totalCount = 2

      mockPrisma.order.findMany.mockResolvedValue(orders)
      mockPrisma.order.count.mockResolvedValue(totalCount)

      const result = await repository.findByUserId(userId, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: orders,
        pagination: {
          page: 1,
          limit: 10,
          total: totalCount,
          totalPages: 1,
        },
      })
    })
  })

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const orderId = 'order123'
      const newStatus = 'FULFILLED'
      const updatedOrder = {
        id: orderId,
        status: newStatus,
        updatedAt: expect.any(Date),
      }

      mockPrisma.order.update.mockResolvedValue(updatedOrder)

      const result = await repository.updateStatus(orderId, newStatus)

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { 
          status: newStatus,
          updatedAt: expect.any(Date),
        },
      })
      expect(result).toEqual(updatedOrder)
    })
  })

  describe('findByStripePaymentIntentId', () => {
    it('should find order by Stripe payment intent ID', async () => {
      const paymentIntentId = 'pi_test123'
      const expectedOrder = {
        id: 'order123',
        stripePaymentIntentId: paymentIntentId,
        items: [],
        user: { id: 'user123' },
      }

      mockPrisma.order.findFirst.mockResolvedValue(expectedOrder)

      const result = await repository.findByStripePaymentIntentId(paymentIntentId)

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: paymentIntentId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      })
      expect(result).toEqual(expectedOrder)
    })
  })

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        totalOrders: 10,
        totalRevenue: 1000,
        ordersByStatus: [
          { status: 'PAID', _count: { status: 5 } },
          { status: 'FULFILLED', _count: { status: 3 } },
          { status: 'PENDING', _count: { status: 2 } },
        ],
      }

      mockPrisma.order.count.mockResolvedValue(mockStats.totalOrders)
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: mockStats.totalRevenue } })
      mockPrisma.order.groupBy.mockResolvedValue(mockStats.ordersByStatus)

      const result = await repository.getOrderStats()

      expect(result).toEqual({
        totalOrders: 10,
        totalRevenue: 1000,
        averageOrderValue: 100,
        ordersByStatus: {
          PENDING: 2,
          PAID: 5,
          FULFILLED: 3,
          CANCELLED: 0,
        },
      })
    })

    it('should handle zero orders', async () => {
      mockPrisma.order.count.mockResolvedValue(0)
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: null } })
      mockPrisma.order.groupBy.mockResolvedValue([])

      const result = await repository.getOrderStats()

      expect(result).toEqual({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {
          PENDING: 0,
          PAID: 0,
          FULFILLED: 0,
          CANCELLED: 0,
        },
      })
    })
  })

  describe('searchOrders', () => {
    it('should search orders by query', async () => {
      const query = 'john'
      const orders = [
        { id: 'order1', user: { name: 'John Doe' } },
      ]

      mockPrisma.order.findMany.mockResolvedValue(orders)
      mockPrisma.order.count.mockResolvedValue(1)

      const result = await repository.searchOrders(query)

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: { contains: query, mode: 'insensitive' } },
            { stripePaymentIntentId: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      })
      expect(result.data).toEqual(orders)
    })
  })

  describe('bulkUpdateStatus', () => {
    it('should update multiple orders status', async () => {
      const orderIds = ['order1', 'order2', 'order3']
      const status = 'FULFILLED'

      mockPrisma.order.updateMany.mockResolvedValue({ count: 3 })

      const result = await repository.bulkUpdateStatus(orderIds, status)

      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: { in: orderIds } },
        data: { 
          status,
          updatedAt: expect.any(Date),
        },
      })
      expect(result).toBe(3)
    })
  })

  describe('deleteOrder', () => {
    it('should delete order and its items', async () => {
      const orderId = 'order123'
      const deletedOrder = { id: orderId }

      mockPrisma.orderItem.deleteMany.mockResolvedValue({ count: 2 })
      mockPrisma.order.delete.mockResolvedValue(deletedOrder)

      const result = await repository.deleteOrder(orderId)

      expect(mockPrisma.orderItem.deleteMany).toHaveBeenCalledWith({
        where: { orderId },
      })
      expect(mockPrisma.order.delete).toHaveBeenCalledWith({
        where: { id: orderId },
      })
      expect(result).toEqual(deletedOrder)
    })
  })
})