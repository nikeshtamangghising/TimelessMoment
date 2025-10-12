import { prisma } from './db'
import { orderRepository } from './order-repository'

export class OrderProcessingService {
  /**
   * Process pending orders - update them to PROCESSING status
   * This should be called after order creation to start the fulfillment process
   */
  async processPendingOrders() {
    try {
      // Get all pending orders that are ready for processing
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PENDING'
        },
        include: {
          items: {
            include: {
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

          // Create initial tracking entry
          await prisma.orderTracking.create({
            data: {
              orderId: order.id,
              status: 'PROCESSING',
              message: 'Order is being processed for fulfillment',
            }
          })

          processedCount++
        } catch (error) {
          console.error(`Failed to process order ${order.id}:`, error)
        }
      }

      return { processedCount, total: pendingOrders.length }
    } catch (error) {
      console.error('Error processing pending orders:', error)
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

      const processingOrders = await prisma.order.findMany({
        where: {
          status: 'PROCESSING',
          createdAt: {
            lte: cutoffTime
          }
        },
        include: {
          items: {
            include: {
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

          // Additional tracking entry for shipping
          await prisma.orderTracking.create({
            data: {
              orderId: order.id,
              status: 'SHIPPED',
              message: 'Order has been shipped and is on its way',
            }
          })

          shippedCount++
        } catch (error) {
          console.error(`Failed to ship order ${order.id}:`, error)
        }
      }

      return { shippedCount, total: processingOrders.length }
    } catch (error) {
      console.error('Error shipping processing orders:', error)
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
      console.error(`Error processing order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Get orders that need processing
   */
  async getOrdersNeedingProcessing() {
    return {
      pending: await prisma.order.count({ where: { status: 'PENDING' } }),
      processing: await prisma.order.count({ where: { status: 'PROCESSING' } }),
      shipped: await prisma.order.count({ where: { status: 'SHIPPED' } }),
    }
  }
}

export const orderProcessingService = new OrderProcessingService()
