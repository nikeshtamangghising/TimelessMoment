import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe'
import { createAuthHandler } from '@/lib/auth-middleware'
import { getCartSummary } from '@/lib/cart-utils'
import { productRepository } from '@/lib/product-repository'
import { z } from 'zod'

const createPaymentIntentSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).min(1, 'Cart must have at least one item'),
})

export const POST = createAuthHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validationResult = createPaymentIntentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { items } = validationResult.data

    // Validate and fetch current product data
    const cartItems = []
    for (const item of items) {
      const product = await productRepository.findById(item.productId)
      
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Product ${product.name} is no longer available` },
          { status: 400 }
        )
      }

      if (product.inventory < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for ${product.name}. Only ${product.inventory} available` },
          { status: 400 }
        )
      }

      cartItems.push({
        productId: product.id,
        quantity: item.quantity,
        product,
      })
    }

    // Calculate order total
    const summary = getCartSummary(cartItems)

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      summary.total,
      'usd',
      {
        orderItems: JSON.stringify(items),
        itemsCount: summary.itemsCount.toString(),
        subtotal: summary.subtotal.toString(),
        shipping: summary.shipping.toString(),
        tax: summary.tax.toString(),
      }
    )

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      summary: {
        subtotal: summary.subtotal,
        shipping: summary.shipping,
        tax: summary.tax,
        total: summary.total,
        itemsCount: summary.itemsCount,
      },
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})