import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems, products, users } from '@/lib/db/schema'
import { eq, gte, lt, ne, and, sql, desc, inArray } from 'drizzle-orm'
import { createAdminHandler } from '@/lib/auth-middleware'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    // Calculate date range based on timeRange
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get basic stats
    let totalRevenue, totalOrders, totalCustomers, totalProducts
    let previousPeriodRevenue, previousPeriodOrders, previousPeriodCustomers
    let topSellingProducts, recentOrders, recentCustomers

    try {
      [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      previousPeriodRevenue,
      previousPeriodOrders,
      previousPeriodCustomers,
      topSellingProducts,
      recentOrders,
      recentCustomers
    ] = await Promise.all([
      // Current period revenue
      db.select({ sum: sql<number>`sum(${orders.total})` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, startDate),
          ne(orders.status, 'CANCELLED')
        ))
        .then(result => ({
          _sum: { total: parseFloat(result[0]?.sum?.toString() || '0') }
        })),
      
      // Current period orders
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(
          gte(orders.createdAt, startDate),
          ne(orders.status, 'CANCELLED')
        ))
        .then(result => Number(result[0]?.count || 0)),
      
      // Total customers
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'CUSTOMER'))
        .then(result => Number(result[0]?.count || 0)),
      
      // Total products
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.isActive, true))
        .then(result => Number(result[0]?.count || 0)),
      
      // Previous period revenue for comparison
      (async () => {
        const periodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
        const result = await db.select({ sum: sql<number>`sum(${orders.total})` })
          .from(orders)
          .where(and(
            gte(orders.createdAt, periodStart),
            lt(orders.createdAt, startDate),
            ne(orders.status, 'CANCELLED')
          ))
        return {
          _sum: { total: parseFloat(result[0]?.sum?.toString() || '0') }
        }
      })(),
      
      // Previous period orders
      (async () => {
        const periodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
        const result = await db.select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(
            gte(orders.createdAt, periodStart),
            lt(orders.createdAt, startDate),
            ne(orders.status, 'CANCELLED')
          ))
        return Number(result[0]?.count || 0)
      })(),
      
      // Previous period customers (approximate)
      (async () => {
        const periodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
        const result = await db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(and(
            eq(users.role, 'CUSTOMER'),
            gte(users.createdAt, periodStart),
            lt(users.createdAt, startDate)
          ))
        return Number(result[0]?.count || 0)
      })(),
      
      // Top selling products (using raw SQL for groupBy)
      (async () => {
        try {
          const result = await db.execute(sql`
            SELECT 
              oi."productId",
              SUM(oi.quantity)::int as "total_quantity",
              SUM(oi.price * oi.quantity)::decimal as "total_revenue"
            FROM order_items oi
            INNER JOIN orders o ON oi."orderId" = o.id
            WHERE o."createdAt" >= ${startDate}
              AND o.status != 'CANCELLED'
            GROUP BY oi."productId"
            ORDER BY total_quantity DESC
            LIMIT 5
          `) as Array<{ productId: string; total_quantity: string | number; total_revenue: string | number }>
          return result.map(row => ({
            productId: row.productId,
          _sum: {
              quantity: Number(row.total_quantity) || 0,
              price: Number(row.total_revenue) || 0
          }
          }))
        } catch (error) {
          console.error('Error fetching top selling products:', error)
          return []
        }
      })(),
      
      // Recent orders
      db.query.orders.findMany({
        where: and(
          gte(orders.createdAt, startDate)
        ),
        with: {
          user: {
            columns: { name: true, email: true }
          }
        },
        orderBy: desc(orders.createdAt),
        limit: 10
      }),
      
      // Recent customers
      db.query.users.findMany({
        where: and(
          eq(users.role, 'CUSTOMER'),
          gte(users.createdAt, startDate)
        ),
        orderBy: desc(users.createdAt),
        limit: 10
      })
    ])
    } catch (error) {
      console.error('Error in Promise.all for analytics:', error)
      throw error
    }

    // Get product details for top selling products
    const productIds = topSellingProducts.map(item => item.productId)
    let productMap: Record<string, string> = {}
    
    if (productIds.length > 0) {
      try {
        const productsResult = await db.query.products.findMany({
          where: inArray(products.id, productIds),
          columns: { id: true, name: true }
    })
        productMap = Object.fromEntries(productsResult.map(p => [p.id, p.name]))
      } catch (error) {
        console.error('Error fetching product details:', error)
        // Continue with empty productMap
      }
    }

    // Calculate changes
    const revenueChange = previousPeriodRevenue._sum.total 
      ? ((totalRevenue._sum.total || 0) - previousPeriodRevenue._sum.total) / previousPeriodRevenue._sum.total * 100
      : 0
    
    const ordersChange = previousPeriodOrders 
      ? (totalOrders - previousPeriodOrders) / previousPeriodOrders * 100
      : 0
    
    const customersChange = previousPeriodCustomers 
      ? (totalCustomers - previousPeriodCustomers) / previousPeriodCustomers * 100
      : 0

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0

    // Generate sales data for charts (simplified)
    const salesData = []
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const interval = timeRange === '7d' ? 1 : timeRange === '30d' ? 7 : timeRange === '90d' ? 30 : 30
    
    for (let i = 0; i < days; i += interval) {
      const periodStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const periodEnd = new Date(periodStart.getTime() + interval * 24 * 60 * 60 * 1000)
      
      const [periodRevenueResult, periodOrdersResult] = await Promise.all([
        db.select({ sum: sql<number>`sum(${orders.total})` })
          .from(orders)
          .where(and(
            gte(orders.createdAt, periodStart),
            lt(orders.createdAt, periodEnd),
            ne(orders.status, 'CANCELLED')
          )),
        db.select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(
            gte(orders.createdAt, periodStart),
            lt(orders.createdAt, periodEnd),
            ne(orders.status, 'CANCELLED')
          ))
      ])
      
      const periodRevenue = {
        _sum: { total: parseFloat(periodRevenueResult[0]?.sum?.toString() || '0') }
      }
      const periodOrders = Number(periodOrdersResult[0]?.count || 0)
      
      salesData.push({
        period: timeRange === '7d' ? `Day ${Math.floor(i / interval) + 1}` : 
                timeRange === '30d' ? `Week ${Math.floor(i / interval) + 1}` :
                timeRange === '90d' ? `Month ${Math.floor(i / interval) + 1}` :
                `Q${Math.floor(i / interval) + 1}`,
        revenue: periodRevenue._sum.total || 0,
        orders: periodOrders
      })
    }

    // Generate recent activity
    const recentActivity = [
      ...recentOrders.slice(0, 5).map(order => ({
        id: order.id,
        type: 'order' as const,
        description: `New order #${order.id.slice(-6)} placed${order.user ? ` by ${order.user.name}` : ''}`,
        timestamp: order.createdAt.toISOString()
      })),
      ...recentCustomers.slice(0, 3).map(customer => ({
        id: customer.id,
        type: 'customer' as const,
        description: `New customer registered: ${customer.name}`,
        timestamp: customer.createdAt.toISOString()
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)

    const analytics = {
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueChange: Math.round(revenueChange * 100) / 100,
      ordersChange: Math.round(ordersChange * 100) / 100,
      customersChange: Math.round(customersChange * 100) / 100,
      productsChange: 0, // Not implemented for now
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      conversionRate: 0, // Would need visitor tracking
      topSellingProducts: topSellingProducts.map(item => ({
        id: item.productId,
        name: productMap[item.productId] || 'Unknown Product',
        sales: item._sum.quantity || 0,
        revenue: item._sum.price || 0
      })),
      recentActivity,
      salesData
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
