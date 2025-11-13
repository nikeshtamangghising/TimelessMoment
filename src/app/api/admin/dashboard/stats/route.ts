import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { orderRepository } from '@/lib/order-repository'
import { productRepository } from '@/lib/product-repository'
import { db } from '@/lib/db'
import { orders, products, users } from '@/lib/db/schema'
import { eq, gte, lt, ne, sql, and } from 'drizzle-orm'

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
      Promise.all([
        db.select({ sum: sql<number>`sum(${orders.total})` })
          .from(orders)
          .where(and(
            gte(orders.createdAt, sixtyDaysAgo),
            lt(orders.createdAt, thirtyDaysAgo)
          )),
        db.select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(
            gte(orders.createdAt, sixtyDaysAgo),
            lt(orders.createdAt, thirtyDaysAgo)
          ))
      ]).then(([sumResult, countResult]) => ({
        _sum: { total: parseFloat(sumResult[0]?.sum?.toString() || '0') },
        _count: { id: Number(countResult[0]?.count || 0) }
      })),

      // Current product count
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.isActive, true))
        .then(result => Number(result[0]?.count || 0)),

      // Previous product count (30 days ago)
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(
          eq(products.isActive, true),
          lt(products.createdAt, thirtyDaysAgo)
        ))
        .then(result => Number(result[0]?.count || 0)),

      // Current customer count
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'CUSTOMER'))
        .then(result => Number(result[0]?.count || 0)),

      // Previous customer count (30 days ago)
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          eq(users.role, 'CUSTOMER'),
          lt(users.createdAt, thirtyDaysAgo)
        ))
        .then(result => Number(result[0]?.count || 0)),
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})