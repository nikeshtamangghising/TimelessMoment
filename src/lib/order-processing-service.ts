import { db } from './db'
import { orderRepository } from './order-repository'
import { orders, orderItems } from './db/schema'
import { eq, lte, sql } from 'drizzle-orm'

export class OrderProcessingService {
  /**
   * Process pending orders - update them to PROCESSING status
   * This should be called after order creation to start the fulfillment process
   */
  async processPendingOrders() {
    try {
      // Get all pending orders that are ready for processing
      const pendingOrders = await db.query.orders.findMany({
        where: eq(orders.status, 'PENDING'),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      })

      let processedCount = 0

      for (const order of pendingOrders) {
        try {
          // Update order status to PROCESSING
          await orderRepository.updateStatus(order.id, 'PROCESSING')

          // Note: orderTracking table doesn't exist in Drizzle schema
          // This functionality would need to be implemented differently
          // For now, we'll skip this as it's not in the schema

          processedCount++
        } catch (error) {
          console.error(`Failed to process order ${order.id}:`, error)
        }
      }

      return { processedCount, total: pendingOrders.length }
    } catch (error) {
      throw error
    }
  }

  /**
   * Ship orders that have been processing for a certain time
   * This simulates the fulfillment process
   */
  async shipProcessingOrders() {
    try {
      // Get orders that have been processing for more than 1 minute (for demo purposes)
      // In production, this could be based on actual fulfillment time
      const cutoffTime = new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago

      const processingOrders = await db.query.orders.findMany({
        where: (orders, { eq, lte, and }) => and(
          eq(orders.status, 'PROCESSING'),
          lte(orders.createdAt, cutoffTime)
        ),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      })

      let shippedCount = 0

      for (const order of processingOrders) {
        try {
          // Update order status to SHIPPED (this will auto-generate tracking number)
          await orderRepository.updateStatus(order.id, 'SHIPPED')

          // Note: orderTracking table doesn't exist in Drizzle schema
          // This functionality would need to be implemented differently
          // For now, we'll skip this as it's not in the schema

          shippedCount++
        } catch (error) {
          console.error(`Failed to ship order ${order.id}:`, error)
        }
      }

      return { shippedCount, total: processingOrders.length }
    } catch (error) {
      throw error
    }
  }

  /**
   * Process a single order through its lifecycle
   */
  async processOrderLifecycle(orderId: string) {
    try {
      const order = await orderRepository.findById(orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      let updates: any = []

      switch (order.status) {
        case 'PENDING':
          // Move to PROCESSING
          await orderRepository.updateStatus(orderId, 'PROCESSING')
          updates.push({
            status: 'PROCESSING',
            message: 'Order processing started',
            timestamp: new Date()
          })
          break

        case 'PROCESSING':
          // Move to SHIPPED after some time (simulate fulfillment)
          await orderRepository.updateStatus(orderId, 'SHIPPED')
          updates.push({
            status: 'SHIPPED',
            message: 'Order shipped',
            timestamp: new Date()
          })
          break

        case 'SHIPPED':
          // Could move to DELIVERED after delivery time
          // For now, leave as SHIPPED
          break
      }

      return { order, updates }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get orders that need processing
   */
  async getOrdersNeedingProcessing() {
    const [pendingCount, processingCount, shippedCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'PENDING')),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'PROCESSING')),
      db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'SHIPPED')),
    ])

    return {
      pending: Number(pendingCount[0]?.count || 0),
      processing: Number(processingCount[0]?.count || 0),
      shipped: Number(shippedCount[0]?.count || 0),
    }
  }
}

export const orderProcessingService = new OrderProcessingService()
