import { NextRequest, NextResponse } from 'next/server'
import { orderRepository } from '@/lib/order-repository'
import { updateOrderSchema, updateShippingAddressSchema } from '@/lib/validations'
import { createAuthHandler, createAdminHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { EmailService } from '@/lib/email-service'
import { prisma } from '@/lib/db-utils'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const GET = createAuthHandler<RouteParams>(async (
  request: NextRequest,
  context?: RouteParams
) => {
  if (!context) {
    return NextResponse.json(
      { error: 'Invalid route parameters' },
      { status: 400 }
    )
  }
  
  const { params } = context
  try {
    const resolvedParams = await params
    const session = await getServerSession()
    const order = await orderRepository.findById(resolvedParams.id)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user can access this order
    const isAdmin = session?.user?.role === 'ADMIN'
    const isOwner = order.userId === session?.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(order)

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = createAuthHandler<RouteParams>(async (
  request: NextRequest,
  context?: RouteParams
) => {
  if (!context) {
    return NextResponse.json(
      { error: 'Invalid route parameters' },
      { status: 400 }
    )
  }
  
  const { params } = context
  try {
    const resolvedParams = await params
    const session = await getServerSession()
    const body = await request.json()
    
    // Check if order exists
    const existingOrder = await orderRepository.findById(resolvedParams.id)
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user can update this order
    const isAdmin = session?.user?.role === 'ADMIN'
    const isOwner = existingOrder.userId === session?.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if this is a status update or shipping address update
    const isStatusUpdate = body.status !== undefined
    const isShippingAddressUpdate = body.shippingAddress !== undefined

    // Handle status update (admin only)
    if (isStatusUpdate) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only administrators can update order status' },
          { status: 403 }
        )
      }

      const validationResult = updateOrderSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validationResult.error.issues 
          },
          { status: 400 }
        )
      }

      const previousStatus = existingOrder.status
      const newStatus = validationResult.data.status

      const updatedOrder = await orderRepository.updateStatus(
        resolvedParams.id, 
        newStatus
      )

      // Send order status update email if status changed
      if (previousStatus !== newStatus) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: existingOrder.userId }
          })

          if (user) {
            await EmailService.sendOrderStatusUpdate({
              order: updatedOrder,
              user,
              previousStatus,
              newStatus
            }, true) // Use queue

            console.log(`Order status update email sent to ${user.email}`)
          }
        } catch (emailError) {
          console.error('Failed to send order status update email:', emailError)
          // Don't fail the order update if email fails
        }
      }

      return NextResponse.json({
        message: 'Order updated successfully',
        order: updatedOrder
      })
    }

    // Handle shipping address update (owner or admin, only for pending orders)
    if (isShippingAddressUpdate) {
      // Only allow updating shipping address for pending orders
      if (existingOrder.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Shipping address can only be updated for pending orders' },
          { status: 400 }
        )
      }

      const validationResult = updateShippingAddressSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validationResult.error.issues 
          },
          { status: 400 }
        )
      }

      const updatedOrder = await orderRepository.updateShippingAddress(
        resolvedParams.id, 
        validationResult.data
      )

      return NextResponse.json({
        message: 'Shipping address updated successfully',
        order: updatedOrder
      })
    }

    return NextResponse.json(
      { error: 'Invalid update request' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating order:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const DELETE = createAdminHandler<RouteParams>(async (
  request: NextRequest,
  context?: RouteParams
) => {
  if (!context) {
    return NextResponse.json(
      { error: 'Invalid route parameters' },
      { status: 400 }
    )
  }
  
  const { params } = context
  try {
    const resolvedParams = await params
    // Check if order exists
    const existingOrder = await orderRepository.findById(resolvedParams.id)
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of cancelled orders
    if (existingOrder.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Only cancelled orders can be deleted' },
        { status: 400 }
      )
    }

    // Order deletion is not implemented yet
    return NextResponse.json(
      { error: 'Order deletion is not supported' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error deleting order:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})