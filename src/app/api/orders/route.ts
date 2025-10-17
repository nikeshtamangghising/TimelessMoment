import { NextRequest, NextResponse } from 'next/server'
import { orderRepository } from '@/lib/order-repository'
import { paginationSchema } from '@/lib/validations'
import { createAuthHandler, createAdminHandler } from '@/lib/auth-middleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const GET = createAuthHandler(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const paginationResult = paginationSchema.safeParse({ page, limit })
    if (!paginationResult.success) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Check if user is admin or regular user
    const isAdmin = session?.user?.role === 'ADMIN'
    
    if (isAdmin) {
      // Admin can see all orders with optional filters
      const status = searchParams.get('status') as any
      const userId = searchParams.get('userId') || undefined
      const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
      const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
      const search = searchParams.get('search')

      let result
      if (search) {
        result = await orderRepository.searchOrders(search, paginationResult.data)
      } else {
        result = await orderRepository.findAll(paginationResult.data, {
          status,
          userId,
          dateFrom,
          dateTo,
        })
      }

      return NextResponse.json(result)
    } else {
      // Regular users can only see their own orders
      const result = await orderRepository.findByUserId(
        session!.user.id,
        paginationResult.data
      )

      return NextResponse.json(result)
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// Admin-only endpoint for order statistics
export const POST = createAdminHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'getStats':
        const stats = await orderRepository.getOrderStats(params.userId)
        return NextResponse.json(stats)

      case 'bulkUpdateStatus':
        if (!params.orderIds || !params.status) {
          return NextResponse.json(
            { error: 'Missing orderIds or status' },
            { status: 400 }
          )
        }
        const updatedCount = await orderRepository.bulkUpdateStatus(
          params.orderIds,
          params.status
        )
        return NextResponse.json({ 
          message: `Updated ${updatedCount} orders`,
          updatedCount 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})