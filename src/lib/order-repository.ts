import { prisma } from './db'
import { 
  CreateOrderInput, 
  PaginationInput,
  UpdateShippingAddressInput
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
          shippingAddress: data.shippingAddress ? data.shippingAddress : undefined,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            })),
          },
        } as any, // Type assertion to bypass Prisma type checking
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

    return order as unknown as OrderWithItems
  }

  async createGuestOrder(data: {
    guestEmail: string
    guestName: string
    items: { productId: string; quantity: number; price: number }[]
    total: number
    shippingAddress: any
    stripePaymentIntentId?: string
  }): Promise<OrderWithItems> {
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

    // Create guest order in a transaction with inventory updates
    const order = await prisma.$transaction(async (tx) => {
      // Create the guest order
      const newOrder = await tx.order.create({
        data: {
          userId: null, // No user for guest orders
          guestEmail: data.guestEmail,
          guestName: data.guestName,
          isGuestOrder: true,
          total: data.total,
          stripePaymentIntentId: data.stripePaymentIntentId,
          status: 'PENDING',
          shippingAddress: data.shippingAddress,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            })),
          },
        } as any, // Type assertion to bypass Prisma type checking
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
            reason: `Inventory reduced for guest order ${newOrder.id}`,
          }
        })
      }

      return newOrder
    })

    // Invalidate related caches
    await invalidateOrder(order.id)

    return order as unknown as OrderWithItems
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
              product: {
                include: {
                  category: true,
                },
              },
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
              product: {
                include: {
                  category: true,
                },
              },
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

  async findByGuestEmail(
    guestEmail: string,
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { 
          guestEmail,
          isGuestOrder: true 
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          user: true,
        },
      }),
      prisma.order.count({ 
        where: { 
          guestEmail,
          isGuestOrder: true 
        } 
      }),
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
              product: {
                include: {
                  category: true,
                },
              },
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
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      throw new Error('Order not found')
    }

    const oldStatus = order.status

    // Update order status in transaction with inventory adjustments if needed
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = { 
        status,
        updatedAt: new Date(),
      }

      // Generate tracking number if status is being updated to SHIPPED and no tracking number exists
      if (status === 'SHIPPED' && !order.trackingNumber) {
        const trackingNumber = `TN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
        updateData.trackingNumber = trackingNumber
      }

      const updated = await tx.order.update({
        where: { id },
        data: updateData,
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

      // Add tracking log entry when status changes
      await tx.orderTracking.create({
        data: {
          orderId: id,
          status,
          message: `Order status updated from ${oldStatus} to ${status}`,
        }
      })

      return updated
    })

    return updatedOrder
  }

  async updateShippingAddress(id: string, data: UpdateShippingAddressInput): Promise<Order> {
    const order = await prisma.order.findUnique({
      where: { id }
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Only allow updating shipping address if order is still pending
    if (order.status !== 'PENDING') {
      throw new Error('Shipping address can only be updated for pending orders')
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        shippingAddress: data.shippingAddress,
        updatedAt: new Date(),
      } as any, // Type assertion to bypass Prisma type checking
    })

    // Invalidate cache
    await invalidateOrder(id)

    return updatedOrder
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<OrderWithItems | null> {
    return prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: true,
      },
    })
  }

  async getRecentOrders(limit: number = 10): Promise<OrderWithItems[]> {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
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
              product: {
                include: {
                  category: true,
                },
              },
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

  async getOrdersRequiringFulfillment(): Promise<OrderWithItems[]> {
    return prisma.order.findMany({
      where: { status: 'PROCESSING' },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
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

  async bulkUpdateStatus(orderIds: string[], status: OrderStatus): Promise<number> {
    // For bulk updates, we need to handle tracking numbers and logs individually
    let updatedCount = 0
    
    for (const orderId of orderIds) {
      try {
        await this.updateStatus(orderId, status)
        updatedCount++
      } catch (error) {
        console.error(`Failed to update status for order ${orderId}:`, error)
        // Continue with other orders
      }
    }
    
    return updatedCount
  }
}

// Export singleton instance
export const orderRepository = new OrderRepository()