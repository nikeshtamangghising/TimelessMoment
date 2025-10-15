import { NextRequest, NextResponse } from 'next/server'
import { orderRepository } from '@/lib/order-repository'
import { createAuthHandler, createAdminHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Validation schema for adding tracking information
const addTrackingSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  message: z.string().optional(),
})

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
    
    // Check if order exists
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

    // Get tracking logs
    const trackingLogs = await prisma.orderTracking.findMany({
      where: { orderId: resolvedParams.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(trackingLogs)

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = createAdminHandler<RouteParams>(async (
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
    const body = await request.json()
    
    // Validate request data
    const validationResult = addTrackingSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { status, message } = validationResult.data

    // Check if order exists
    const order = await orderRepository.findById(resolvedParams.id)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate tracking number if status is being updated to SHIPPED and no tracking number exists
    let updateData: any = {
      status,
    }

    if (status === 'SHIPPED' && !order.trackingNumber) {
      // Generate a tracking number
      const trackingNumber = `TN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      updateData.trackingNumber = trackingNumber
    }

    // Update order status and tracking number if needed
    const updatedOrder = await prisma.order.update({
      where: { id: resolvedParams.id },
      data: updateData,
    })

    // Add tracking log entry
    const trackingLog = await prisma.orderTracking.create({
      data: {
        orderId: resolvedParams.id,
        status,
        message: message || `Order status updated to ${status}`,
      }
    })

    return NextResponse.json({
      message: 'Tracking information added successfully',
      order: updatedOrder,
      trackingLog,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})