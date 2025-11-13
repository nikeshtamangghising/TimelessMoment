import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq, and, gt, lte, asc } from 'drizzle-orm'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'lowStock').toLowerCase()
    const threshold = parseInt(searchParams.get('threshold') || '10')

    // Fetch products for export based on type
    let products: any[] = []

    if (type === 'lowstock') {
      products = await db.query.products.findMany({
        where: and(
          eq(products.isActive, true),
          gt(products.inventory, 0),
          lte(products.inventory, threshold)
        ),
        with: { category: true },
        orderBy: asc(products.inventory)
      })
    } else if (type === 'outofstock') {
      products = await db.query.products.findMany({
        where: and(
          eq(products.isActive, true),
          eq(products.inventory, 0)
        ),
        with: { category: true },
        orderBy: asc(products.name)
      })
    } else {
      products = await db.query.products.findMany({
        where: eq(products.isActive, true),
        with: { category: true },
        orderBy: asc(products.name)
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
