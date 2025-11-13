import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { createAdminHandler } from '@/lib/auth-middleware'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()

    const customers = await db.query.users.findMany({
      where: eq(users.role, 'CUSTOMER'),
      with: {
        orders: {
          columns: { total: true, createdAt: true },
          orderBy: desc(orders.createdAt)
        }
      }
    })

    // Build CSV
    const headers = [
      'id','name','email','joinedAt','totalOrders','totalSpent','lastOrderDate'
    ]

    const rows = customers.map(c => {
      const totalOrders = c.orders?.length || 0
      const totalSpent = (c.orders || []).reduce((sum, o) => {
        const orderTotal = parseFloat(o.total.toString())
        return sum + orderTotal
      }, 0)
      const lastOrder = c.orders && c.orders.length > 0 ? c.orders[0] : null
      return [
        c.id,
        c.name || '',
        c.email,
        c.createdAt.toISOString(),
        String(totalOrders),
        String(totalSpent),
        lastOrder ? lastOrder.createdAt.toISOString() : ''
      ]
    })

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="customers_export_${Date.now()}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 })
  }
})