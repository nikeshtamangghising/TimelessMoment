import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAdminHandler } from '@/lib/auth-middleware'

export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get products that are low on stock
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        inventory: {
          lte: prisma.product.fields.lowStockThreshold
        }
      },
      select: {
        id: true,
        name: true,
        inventory: true,
        lowStockThreshold: true,
        price: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        inventory: 'asc'
      },
      take: limit
    })

    return NextResponse.json({
      data: lowStockProducts,
      count: lowStockProducts.length
    })
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
})
