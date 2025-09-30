import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { orderRepository } from '@/lib/order-repository'
import { productRepository } from '@/lib/product-repository'
import { prisma } from '@/lib/db'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    // Get current date and 30 days ago for comparison
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get current period stats
    const [
      currentOrderStats,
      previousOrderStats,
      currentProductCount,
      previousProductCount,
      currentCustomerCount,
      previousCustomerCount
    ] = await Promise.all([
      // Current period orders (last 30 days)
      orderRepository.getOrderStats(),
      
      // Previous period orders (30-60 days ago)
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Current product count
      prisma.product.count({
        where: { isActive: true },
      }),

      // Previous product count (30 days ago)
      prisma.product.count({
        where: {
          isActive: true,
          createdAt: { lt: thirtyDaysAgo },
        },
      }),

      // Current customer count
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),

      // Previous customer count (30 days ago)
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { lt: thirtyDaysAgo },
        },
      }),
    ])

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const previousRevenue = previousOrderStats._sum.total || 0
    const previousOrders = previousOrderStats._count.id || 0

    const stats = {
      totalRevenue: currentOrderStats.totalRevenue,
      totalOrders: currentOrderStats.totalOrders,
      totalCustomers: currentCustomerCount,
      totalProducts: currentProductCount,
      revenueChange: calculateChange(currentOrderStats.totalRevenue, previousRevenue),
      ordersChange: calculateChange(currentOrderStats.totalOrders, previousOrders),
      customersChange: calculateChange(currentCustomerCount, previousCustomerCount),
      productsChange: calculateChange(currentProductCount, previousProductCount),
      ordersByStatus: currentOrderStats.ordersByStatus,
      averageOrderValue: currentOrderStats.averageOrderValue,
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})