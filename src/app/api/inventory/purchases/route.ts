import { NextRequest, NextResponse } from 'next/server'
import { createAdminHandler } from '@/lib/auth-middleware'
import { orderRepository } from '@/lib/order-repository'
import { paginationSchema } from '@/lib/validations'

// GET /api/inventory/purchases - Get purchase history for inventory items
export const GET = createAdminHandler(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const paginationResult = paginationSchema.safeParse({ page, limit })
    if (!paginationResult.success) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Parse filter parameters
    const filters = {
      productId: searchParams.get('productId') || undefined,
    }

    // Fetch all orders (in a real implementation, we would filter by date range)
    const ordersResponse = await orderRepository.findAll(
      paginationResult.data,
      { status: 'DELIVERED' } // Only completed orders
    )

    // Transform orders into purchase history format
    const purchaseHistory = ordersResponse.data
      .filter(order => {
        // If productId filter is provided, only include orders with that product
        if (filters.productId) {
          return order.items.some(item => item.productId === filters.productId)
        }
        return true
      })
      .flatMap(order => {
        return order.items
          .filter(item => {
            // If productId filter is provided, only include that product
            if (filters.productId) {
              return item.productId === filters.productId
            }
            return true
          })
          .map(item => ({
            id: `${order.id}-${item.id}`,
            productId: item.productId,
            quantity: item.quantity,
            totalValue: item.price * item.quantity,
            buyerName: order.user?.name || order.guestName || 'Anonymous',
            buyerEmail: order.user?.email || order.guestEmail || 'No email',
            createdAt: order.createdAt.toISOString(),
            product: {
              id: item.product.id,
              name: item.product.name,
              price: item.price
            }
          }))
      })

    // For pagination, we'll need to handle this differently in a real implementation
    // This is a simplified version for demonstration
    const paginatedResult = {
      data: purchaseHistory.slice(0, paginationResult.data.limit),
      pagination: {
        page: paginationResult.data.page,
        limit: paginationResult.data.limit,
        total: purchaseHistory.length,
        totalPages: Math.ceil(purchaseHistory.length / paginationResult.data.limit)
      }
    }

    return NextResponse.json(paginatedResult)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})