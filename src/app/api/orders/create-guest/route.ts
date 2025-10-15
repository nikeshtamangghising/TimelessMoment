import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { orderRepository } from '@/lib/order-repository'
import { orderProcessingService } from '@/lib/order-processing-service'

const createGuestOrderRequestSchema = z.object({
  guestEmail: z.string().email(),
  guestName: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1),
  total: z.number().positive(),
  shippingAddress: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
  }),
  paymentTransactionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parse = createGuestOrderRequestSchema.safeParse(body)
    
    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parse.error.issues },
        { status: 400 }
      )
    }

    const { guestEmail, guestName, items, total, shippingAddress, paymentTransactionId } = parse.data

    // Generate a payment transaction ID if not provided (for demo/test orders)
    const finalPaymentTransactionId = paymentTransactionId || `guest-order-${Date.now()}`

    const order = await orderRepository.createGuestOrder({
      guestEmail,
      guestName,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      total,
      shippingAddress,
      stripePaymentIntentId: finalPaymentTransactionId,
    })

    // Start order processing workflow
    try {
      await orderProcessingService.processOrderLifecycle(order.id)
    } catch (processingError) {
      console.error('Failed to start order processing:', processingError)
      // Don't fail the order if processing fails
    }

    return NextResponse.json({ success: true, order })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create guest order' },
      { status: 400 }
    )
  }
}
