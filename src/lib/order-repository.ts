import { db } from './db'
import { orders, orderItems, products, categories, users, inventoryAdjustments } from './db/schema'
import { eq, and, or, desc, asc, gte, lte, sql, ilike, inArray } from 'drizzle-orm'
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
      const [product] = await db.select({
        inventory: products.inventory,
        name: products.name
      })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1)
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }
      
      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for product ${product.name}. Available: ${product.inventory}, Requested: ${item.quantity}`)
      }
    }

    // Create order
    const [newOrder] = await db.insert(orders).values({
      userId: data.userId,
      total: data.total.toString(),
      stripePaymentIntentId: data.stripePaymentIntentId,
      status: 'PENDING',
      shippingAddress: data.shippingAddress ? data.shippingAddress : undefined,
    }).returning()

    // Create order items
    const itemsData = data.items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price.toString()
    }))
    await db.insert(orderItems).values(itemsData)

    // Update product inventory and create adjustments
    for (const item of data.items) {
      await db.update(products)
        .set({ 
          inventory: sql`${products.inventory} - ${item.quantity}`,
          orderCount: sql`${products.orderCount} + 1`,
          purchaseCount: sql`${products.purchaseCount} + ${item.quantity}`
        })
        .where(eq(products.id, item.productId))

      await db.insert(inventoryAdjustments).values({
        productId: item.productId,
        quantity: -item.quantity,
        changeType: 'ORDER_PLACED',
        reason: `Inventory reduced for order`,
      })
    }

    // Fetch the complete order with relations
    const order = await this.findById(newOrder.id)

    // Invalidate related caches
    await invalidateOrder(newOrder.id)

    return order!
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
      const [product] = await db.select({
        inventory: products.inventory,
        name: products.name
      })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1)
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }
      
      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for product ${product.name}. Available: ${product.inventory}, Requested: ${item.quantity}`)
      }
    }

    // Create guest order
    const [newOrder] = await db.insert(orders).values({
      userId: null,
      guestEmail: data.guestEmail,
      guestName: data.guestName,
      isGuestOrder: true,
      total: data.total.toString(),
      stripePaymentIntentId: data.stripePaymentIntentId,
      status: 'PENDING',
      shippingAddress: data.shippingAddress,
    }).returning()

    // Create order items
    const itemsData = data.items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price.toString()
    }))
    await db.insert(orderItems).values(itemsData)

    // Update product inventory and create adjustments
    for (const item of data.items) {
      await db.update(products)
        .set({ 
          inventory: sql`${products.inventory} - ${item.quantity}`,
          orderCount: sql`${products.orderCount} + 1`,
          purchaseCount: sql`${products.purchaseCount} + ${item.quantity}`
        })
        .where(eq(products.id, item.productId))

      await db.insert(inventoryAdjustments).values({
        productId: item.productId,
        quantity: -item.quantity,
        changeType: 'ORDER_PLACED',
        reason: `Inventory reduced for guest order`,
      })
    }

    // Fetch the complete order with relations
    const order = await this.findById(newOrder.id)

    // Invalidate related caches
    await invalidateOrder(newOrder.id)

    return order!
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    const cacheKey = generateOrderCacheKey(id)
    
    return getCachedData(
      cacheKey,
      async () => {
        const result = await db.query.orders.findFirst({
          where: eq(orders.id, id),
          with: {
            items: {
              with: {
                product: {
                  with: {
                    category: true,
                  },
                },
              },
            },
            user: true,
          },
        })
        return result as OrderWithItems | null
      },
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
    const offset = (page - 1) * limit

    const [ordersData, [{ count: totalCount }]] = await Promise.all([
      db.query.orders.findMany({
        where: eq(orders.userId, userId),
        offset,
        limit,
        orderBy: desc(orders.createdAt),
        with: {
          items: {
            with: {
              product: {
                with: {
                  category: true,
                },
              },
            },
          },
          user: true,
        },
      }),
      db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(orders)
        .where(eq(orders.userId, userId)),
    ])

    return {
      data: ordersData as OrderWithItems[],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }
  }

  async findByGuestEmail(
    guestEmail: string,
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = pagination
    const offset = (page - 1) * limit

    const [ordersData, [{ count: totalCount }]] = await Promise.all([
      db.query.orders.findMany({
        where: and(
          eq(orders.guestEmail, guestEmail),
          eq(orders.isGuestOrder, true)
        ),
        offset,
        limit,
        orderBy: desc(orders.createdAt),
        with: {
          items: {
            with: {
              product: {
                with: {
                  category: true,
                },
              },
            },
          },
          user: true,
        },
      }),
      db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(orders)
        .where(and(
          eq(orders.guestEmail, guestEmail),
          eq(orders.isGuestOrder, true)
        )),
    ])

    return {
      data: ordersData as OrderWithItems[],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
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
    const offset = (page - 1) * limit

    const conditions = []

    if (filters.status) {
      conditions.push(eq(orders.status, filters.status))
    }

    if (filters.userId) {
      conditions.push(eq(orders.userId, filters.userId))
    }

    if (filters.dateFrom) {
      conditions.push(gte(orders.createdAt, filters.dateFrom))
    }

    if (filters.dateTo) {
      conditions.push(lte(orders.createdAt, filters.dateTo))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [ordersData, [{ count: totalCount }]] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        offset,
        limit,
        orderBy: desc(orders.createdAt),
        with: {
          items: {
            with: {
              product: {
                with: {
                  category: true,
                },
              },
            },
          },
          user: true,
        },
      }),
      db.select({ count: sql<number>`cast(count(*) as integer)` })
        .from(orders)
        .where(whereClause),
    ])

    return {
      data: ordersData as OrderWithItems[],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: {
          with: {
            product: {
              with: {
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

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === 'SHIPPED' && !order.trackingNumber) {
      const trackingNumber = `TN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      updateData.trackingNumber = trackingNumber
    }

    // Update order status
    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning()

    // Handle inventory adjustments for cancellations/refunds
    if (oldStatus === 'PENDING' && (status === 'CANCELLED' || status === 'REFUNDED')) {
      for (const item of order.items) {
        await db.update(products)
          .set({ inventory: sql`${products.inventory} + ${item.quantity}` })
          .where(eq(products.id, item.productId))

        await db.insert(inventoryAdjustments).values({
          productId: item.productId,
          quantity: item.quantity,
          changeType: 'ORDER_RETURNED',
          reason: `Inventory restored from ${status.toLowerCase()} order`,
        })
      }
    }

    return updatedOrder as Order
  }

  async updateShippingAddress(id: string, data: UpdateShippingAddressInput): Promise<Order> {
    const [order] = await db.select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    if (!order) {
      throw new Error('Order not found')
    }

    // Only allow updating shipping address if order is still pending
    if (order.status !== 'PENDING') {
      throw new Error('Shipping address can only be updated for pending orders')
    }

    const [updatedOrder] = await db.update(orders)
      .set({
        shippingAddress: data.shippingAddress,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    // Invalidate cache
    await invalidateOrder(id)

    return updatedOrder as Order
  }

  async findByStripePaymentIntentId(paymentIntentId: string): Promise<OrderWithItems | null> {
    const result = await db.query.orders.findFirst({
      where: eq(orders.stripePaymentIntentId, paymentIntentId),
      with: {
        items: {
          with: {
            product: {
              with: {
                category: true,
              },
            },
          },
        },
        user: true,
      },
    })
    return result as OrderWithItems | null
  }

  async getRecentOrders(limit: number = 10): Promise<OrderWithItems[]> {
    const result = await db.query.orders.findMany({
      limit,
      orderBy: desc(orders.createdAt),
      with: {
        items: {
          with: {
            product: {
              with: {
                category: true,
              },
            },
          },
        },
        user: true,
      },
    })
    return result as OrderWithItems[]
  }

  async searchOrders(
    query: string,
    pagination: PaginationInput = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<OrderWithItems>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    // Build Drizzle where conditions for search
    const conditions: any[] = []
    if (query) {
      conditions.push(
        or(
          ilike(orders.id, `%${query}%`),
          ilike(orders.stripePaymentIntentId, `%${query}%`),
          sql`EXISTS (SELECT 1 FROM ${users} WHERE ${users.id} = ${orders.userId} AND (${ilike(users.name, `%${query}%`)} OR ${ilike(users.email, `%${query}%`)}))`
        )
      )
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [ordersResult, totalResult] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        limit,
        offset: skip,
        orderBy: desc(orders.createdAt),
        with: {
          items: {
            with: {
              product: {
                with: {
                  category: true
                }
              }
            }
          },
          user: true
        }
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause)
    ])
    
    const orders = ordersResult
    const total = Number(totalResult[0]?.count || 0)

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
    return db.query.orders.findMany({
      where: eq(orders.status, 'PROCESSING'),
      orderBy: asc(orders.createdAt),
      with: {
        items: {
          with: {
            product: {
              with: {
                category: true
              }
            }
          }
        },
        user: true
      }
    }) as Promise<OrderWithItems[]>
  }

  async getOrderStats(userId?: string): Promise<{
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    ordersByStatus: Record<OrderStatus, number>
  }> {
    const whereClause = userId ? eq(orders.userId, userId) : undefined

    const [
      totalOrdersResult,
      revenueResult,
      ordersByStatusResult
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
      db.select({ sum: sql<number>`sum(${orders.total})` })
        .from(orders)
        .where(whereClause),
      db.execute(sql`
        SELECT ${orders.status}, COUNT(*) as count
        FROM ${orders}
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
        GROUP BY ${orders.status}
      `) as Promise<Array<{ status: string; count: string }>>
    ])

    const totalOrders = Number(totalOrdersResult[0]?.count || 0)
    const totalRevenue = parseFloat(revenueResult[0]?.sum?.toString() || '0')
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const statusCounts: Record<OrderStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    }
    
    // Process groupBy results
    const ordersByStatus = await ordersByStatusResult
    for (const row of ordersByStatus) {
      const status = row.status as OrderStatus
      if (status in statusCounts) {
        statusCounts[status] = parseInt(row.count, 10)
      }
    }

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