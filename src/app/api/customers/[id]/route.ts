import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { createAdminHandler } from '@/lib/auth-middleware'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const GET = createAdminHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  try {
    const { id } = await context.params

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        orders: {
          columns: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          },
          orderBy: desc(orders.createdAt)
        }
      }
    })

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const totalOrders = user.orders?.length || 0
    const totalSpent = (user.orders || []).reduce((sum, o) => {
      const orderTotal = parseFloat(o.total.toString())
      return sum + orderTotal
    }, 0)
    const lastOrder = user.orders?.[0] || null

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      joinedAt: user.createdAt.toISOString(),
      totalOrders,
      totalSpent,
      lastOrderDate: lastOrder?.createdAt.toISOString(),
      role: user.role,
      emailVerified: user.emailVerified?.toISOString(),
      orders: user.orders.map(o => ({
        id: o.id,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
})
