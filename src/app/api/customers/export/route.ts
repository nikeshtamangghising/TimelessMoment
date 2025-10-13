import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAdminHandler } from '@/lib/auth-middleware'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'csv').toLowerCase()

    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        orders: { select: { total: true, createdAt: true } },
      }
    })

    // Build CSV
    const headers = [
      'id','name','email','joinedAt','totalOrders','totalSpent','lastOrderDate'
    ]

    const rows = customers.map(c => {
      const totalOrders = c.orders.length
      const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0)
      const lastOrder = c.orders.sort((a,b) => +b.createdAt - +a.createdAt)[0]
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
    console.error('Error exporting customers:', error)
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 })
  }
})