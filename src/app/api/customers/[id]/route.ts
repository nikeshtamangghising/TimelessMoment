import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          }
        }
      }
    })

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const totalOrders = user.orders.length
    const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0)
    const lastOrder = user.orders[0]

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
    console.error('Error fetching customer detail:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
})
