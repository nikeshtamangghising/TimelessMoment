import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq, lte, asc, and, sql } from 'drizzle-orm'
import { createAdminHandler } from '@/lib/auth-middleware'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get products that are low on stock
    const lowStockProducts = await db.query.products.findMany({
      where: (products, { eq, lte, and, sql }) => and(
        eq(products.isActive, true),
        sql`${products.inventory} <= ${products.lowStockThreshold}`
      ),
      columns: {
        id: true,
        name: true,
        inventory: true,
        lowStockThreshold: true,
        price: true
      },
      with: {
        category: {
          columns: {
            name: true
          }
        }
      },
      orderBy: asc(products.inventory),
      limit
    })

    return NextResponse.json({
      data: lowStockProducts,
      count: lowStockProducts.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
})
