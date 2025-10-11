import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAuthHandler } from '@/lib/auth-middleware'
import { getServerSession } from '@/lib/auth'
import { orderRepository } from '@/lib/order-repository'

const createOrderRequestSchema = z.object({
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
  }).optional(),
})

export const POST = createAuthHandler(async (request: NextRequest) => {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parse = createOrderRequestSchema.safeParse(body)
    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parse.error.issues },
        { status: 400 }
      )
    }

    const { items, total, shippingAddress } = parse.data

    const order = await orderRepository.create({
      userId: session.user.id,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      total,
      shippingAddress: shippingAddress ? shippingAddress : undefined,
    })

    return NextResponse.json({ success: true, order })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 400 }
    )
  }
})