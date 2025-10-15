import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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
    const [
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
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true }
      }),
      
      // Current period orders
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' }
        }
      }),
      
      // Total customers
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      
      // Total products
      prisma.product.count({
        where: { isActive: true }
      }),
      
      // Previous period revenue for comparison
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
            lt: startDate
          },
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true }
      }),
      
      // Previous period orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
            lt: startDate
          },
          status: { not: 'CANCELLED' }
        }
      }),
      
      // Previous period customers (approximate)
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
            lt: startDate
          }
        }
      }),
      
      // Top selling products
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: startDate },
            status: { not: 'CANCELLED' }
          }
        },
        _sum: {
          quantity: true,
          price: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),
      
      // Recent orders
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Recent customers
      prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Get product details for top selling products
    const productIds = topSellingProducts.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    })

    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]))

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
      
      const periodRevenue = await prisma.order.aggregate({
        where: {
          createdAt: { gte: periodStart, lt: periodEnd },
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true }
      })
      
      const periodOrders = await prisma.order.count({
        where: {
          createdAt: { gte: periodStart, lt: periodEnd },
          status: { not: 'CANCELLED' }
        }
      })
      
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
        revenue: (item._sum.price || 0) * (item._sum.quantity || 0)
      })),
      recentActivity,
      salesData
    }

    return NextResponse.json(analytics)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
})
