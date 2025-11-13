import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/db/schema'
import { eq, like, or, and, gte, sql, desc, asc, count } from 'drizzle-orm'
import { createAdminHandler } from '@/lib/auth-middleware'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = [eq(users.role, 'CUSTOMER')]

    // Add search filter
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get customers with their order statistics
    const customersResult = await db.query.users.findMany({
      where: whereClause,
      with: {
        orders: {
          columns: {
            id: true,
            total: true,
            createdAt: true,
            status: true
          }
        }
      },
      orderBy: sortBy === 'createdAt' 
        ? (sortOrder === 'desc' ? desc(users.createdAt) : asc(users.createdAt))
        : (sortOrder === 'desc' ? desc(users.name) : asc(users.name)),
      limit,
      offset
    })

    // Get order counts for each customer
    const customersWithCounts = await Promise.all(
      customersResult.map(async (customer) => {
        const orderCountResult = await db.select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(eq(orders.userId, customer.id))
        
        // Filter orders by date if status filter is active
        let filteredOrders = customer.orders || []
        if (status === 'active') {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          filteredOrders = customer.orders.filter(order => 
            new Date(order.createdAt) >= thirtyDaysAgo
          )
        } else if (status === 'inactive') {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          filteredOrders = customer.orders.filter(order => 
            new Date(order.createdAt) < thirtyDaysAgo
          )
        }

        return {
          ...customer,
          orders: filteredOrders,
          _count: {
            orders: Number(orderCountResult[0]?.count || 0)
          }
        }
      })
    )

    // Apply status filter to customers list
    let customers = customersWithCounts
    if (status === 'active') {
      customers = customersWithCounts.filter(c => c._count.orders > 0 && 
        c.orders.some(order => {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          return new Date(order.createdAt) >= thirtyDaysAgo
        })
      )
    } else if (status === 'inactive') {
      customers = customersWithCounts.filter(c => 
        c._count.orders === 0 || 
        !c.orders.some(order => {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          return new Date(order.createdAt) >= thirtyDaysAgo
        })
      )
    }

    // Get total count for pagination
    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)
    const total = Number(totalCountResult[0]?.count || 0)

    // Transform the data to match the expected format
    const transformedCustomers = customers.map(customer => {
      const totalOrders = customer._count.orders
      const totalSpent = customer.orders.reduce((sum, order) => {
        const orderTotal = parseFloat(order.total.toString())
        return sum + orderTotal
      }, 0)
      const lastOrder = customer.orders.length > 0 
        ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        joinedAt: customer.createdAt.toISOString(),
        totalOrders,
        totalSpent,
        isActive: totalOrders > 0 && lastOrder && 
          new Date(lastOrder.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastOrderDate: lastOrder?.createdAt.toISOString(),
        role: customer.role,
        emailVerified: customer.emailVerified?.toISOString()
      }
    })

    return NextResponse.json({
      data: transformedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
})
