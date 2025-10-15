import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { prisma } from '@/lib/db'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'lowStock').toLowerCase()
    const threshold = parseInt(searchParams.get('threshold') || '10')

    // Fetch products for export based on type
    let products: any[] = []

    if (type === 'lowstock') {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          inventory: { gt: 0, lte: threshold },
        },
        include: { category: true },
        orderBy: { inventory: 'asc' },
      })
    } else if (type === 'outofstock') {
      products = await prisma.product.findMany({
        where: {
          isActive: true,
          inventory: 0,
        },
        include: { category: true },
        orderBy: { name: 'asc' },
      })
    } else {
      products = await prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { name: 'asc' },
      })
    }

    const headers = ['id','name','sku','inventory','lowStockThreshold','price','category']
    const rows = products.map(p => [
      p.id,
      p.name,
      p.sku || '',
      String(p.inventory || 0),
      String(p.lowStockThreshold || 0),
      String(p.price || 0),
      (p.category?.name || 'Uncategorized')
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory_${type}_${Date.now()}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export inventory' }, { status: 500 })
  }
})
