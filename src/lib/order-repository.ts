import { prisma } from './db'
import { 
  CreateOrderInput, 
  PaginationInput 
} from './validations'
import type { 
  Order, 
  OrderWithItems, 
  PaginatedResponse,
  OrderStatus 
} from '@/types'
import {
  getCachedData,
  generateOrderCacheKey,
  invalidateOrder,
  CACHE_TAGS,
  CACHE_DURATIONS,
} from './cache'
import { inventoryRepository } from './inventory-repository'

export class OrderRepository {
  async create(data: CreateOrderInput): Promise<OrderWithItems> {
    // First, validate inventory availability
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { inventory: true, name: true }
      })
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }
      
      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for product ${product.name}. Available: ${product.inventory}, Requested: ${item.quantity}`)
      }
    }

    // Create order in a transaction with inventory updates
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: data.userId,
          total: data.total,
          stripePaymentIntentId: data.stripePaymentIntentId,
          status: 'PENDING',
          items: {
            create: data.items,
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

      // Update inventory levels and record adjustments
      for (const item of data.items) {
        // Decrease product inventory
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity
            }
          }
        })

        // Record inventory adjustment
        await tx.inventoryAdjustment.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: 'ORDER_PLACED',
            reason: `Inventory reduced for order ${newOrder.id}`,
          }
        })
      }

      return newOrder
    })

    // Invalidate related caches
    await invalidateOrder(order.id)

    return order
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    const cacheKey = generateOrderCacheKey(id)
    
    return getCachedData(
      cacheKey,
      () => prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      }),
      {
        memoryTtl: CACHE_DURATIONS.SHORT,
        nextjsTags: [CACHE_TAGS.ORDER, `${CACHE_TAGS.ORDER}:${id}`],
        nextjsRevalidate: CACHE_DURATIONS.MEDIUM,
      }
    )
  }

  async findByUserId(
    userId: string,
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      }),
      prisma.order.count({ where: { userId } }),
    ])

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findAll(
    pagination: PaginationInput = { page: 1, limit: 10 },
    filters: {
      status?: OrderStatus
      userId?: string
      dateFrom?: Date
      dateTo?: Date
    } = {}
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where: any = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      }),
      prisma.order.count({ where }),
    ])

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!order) {
      throw new Error('Order not found')
    }

    const oldStatus = order.status

    // Update order status in transaction with inventory adjustments if needed
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date(),
        },
      })

      // Handle inventory adjustments for status changes
      if (oldStatus === 'PENDING' && (status === 'CANCELLED' || status === 'REFUNDED')) {
        // Return inventory to stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                increment: item.quantity
              }
            }
          })

          await tx.inventoryAdjustment.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: status === 'CANCELLED' ? 'ORDER_RETURNED' : 'ORDER_RETURNED',
              reason: `Inventory restored from ${status.toLowerCase()} order ${id}`,
            }
          })
        }
      }

      return updated
    })

    return updatedOrder
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<OrderWithItems | null> {
    return prisma.order.findFirst({
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
  }

  async getOrderStats(userId?: string): Promise<{
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    ordersByStatus: Record<OrderStatus, number>
  }> {
    const where = userId ? { userId } : {}

    const [
      totalOrders,
      revenueResult,
      ordersByStatus
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ])

    const totalRevenue = revenueResult._sum.total || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const statusCounts: Record<OrderStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    }

    ordersByStatus.forEach(item => {
      statusCounts[item.status as OrderStatus] = item._count.status
    })

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus: statusCounts,
    }
  }

  async getRecentOrders(limit: number = 10): Promise<OrderWithItems[]> {
    return prisma.order.findMany({
      take: limit,
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
  }

  async searchOrders(
    query: string,
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where = {
      OR: [
        { id: { contains: query, mode: 'insensitive' as const } },
        { stripePaymentIntentId: { contains: query, mode: 'insensitive' as const } },
        { user: { name: { contains: query, mode: 'insensitive' as const } } },
        { user: { email: { contains: query, mode: 'insensitive' as const } } },
      ],
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      }),
      prisma.order.count({ where }),
    ])

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getOrdersByDateRange(
    startDate: Date,
    endDate: Date,
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<OrderWithItems>> {
    return this.findAll(pagination, {
      dateFrom: startDate,
      dateTo: endDate,
    })
  }

  async getOrdersRequiringFulfillment(): Promise<OrderWithItems[]> {
    return prisma.order.findMany({
      where: { status: 'PROCESSING' },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    })
  }

  async bulkUpdateStatus(orderIds: string[], status: OrderStatus): Promise<number> {
    const result = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { 
        status,
        updatedAt: new Date(),
      },
    })

    return result.count
  }

  async deleteOrder(id: string): Promise<Order> {
    // First delete order items, then the order
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    })

    return prisma.order.delete({
      where: { id },
    })
  }
}

// Export singleton instance
export const orderRepository = new OrderRepository()