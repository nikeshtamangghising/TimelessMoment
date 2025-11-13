export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'
import { getPaymentGatewayManager, PaymentMethod } from '@/lib/payment-gateways'
import { getCartSummaryWithSettings } from '@/lib/cart-utils'
import { productRepository } from '@/lib/product-repository'
import { orderRepository } from '@/lib/order-repository'
import { EmailService } from '@/lib/email-service'
import { db } from '@/lib/db'
import { orders, orderItems, products, inventoryAdjustments } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

// In-memory storage for session data (in production, use Redis or database)
const paymentSessions = new Map<string, any>()

const initiatePaymentSchema = z.object({
  method: z.enum(['esewa', 'khalti', 'cod']),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).min(1, 'Cart must have at least one item'),
  guestEmail: z.string().email().optional(),
  shippingAddress: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = initiatePaymentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { method, items, guestEmail, shippingAddress } = validationResult.data
    
    // Check if user is authenticated (optional for guest checkout)
    const token = await getToken({ req: request })
    const isGuest = !token
    const userId = token?.sub

    // Validate and fetch current product data
    const cartItems = []
    let productName = 'Order'
    
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

      // Use first product name or create a generic name for multiple products
      if (cartItems.length === 1) {
        productName = product.name
      } else if (cartItems.length > 1) {
        productName = `Order with ${cartItems.length} items`
      }
    }

    // Calculate order total
    const summary = await getCartSummaryWithSettings(cartItems)

    // Generate unique order ID
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Get payment gateway manager
    const paymentManager = getPaymentGatewayManager()

    // Prepare payment configuration
    const paymentConfig = {
      method,
      orderId,
      amount: summary.total,
      productName,
      customerInfo: {
        email: isGuest ? guestEmail : token?.email,
        name: isGuest ? undefined : token?.name,
      },
    }

    // Initiate payment
    const paymentResult = await paymentManager.initiatePayment(paymentConfig)

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment initiation failed' },
        { status: 500 }
      )
    }

    // For COD payments, create the order immediately since no external verification is needed
    if (method === 'cod') {
      try {
        // Prepare order data
        const orderItems = cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.discountPrice || item.product.price,
        }))

        // Create order in database
        // Note: For guest users, we'll create a guest user or use a system guest user ID
        let actualUserId = userId
        if (!userId && isGuest && !guestEmail) {
          // For guest orders, we'll need to create a guest user or use a system guest user ID
          // For now, let's skip guest orders and require authentication
          return NextResponse.json(
            { error: 'Guest orders require user authentication. Please sign in to continue.' },
            { status: 400 }
          )
        }

        // Create order and update inventory atomically using Drizzle transaction
        const order = await db.transaction(async (tx) => {
          // Create the order
          const [newOrder] = await tx.insert(orders)
            .values({
              id: orderId,
              userId: actualUserId || null,
              total: summary.total.toString(),
              status: 'PENDING',
              stripePaymentIntentId: paymentResult.transactionId,
              shippingAddress: shippingAddress ? shippingAddress : null,
              isGuestOrder: !actualUserId,
              guestEmail: isGuest ? guestEmail : null,
            })
            .returning()

          // Create order items
          const itemsData = orderItems.map(item => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString(),
          }))
          
          await tx.insert(orderItems)
            .values(itemsData)

          // Update inventory for each item
          for (const item of cartItems) {
            await tx.update(products)
              .set({
                inventory: sql`${products.inventory} - ${item.quantity}`,
                updatedAt: new Date()
              })
              .where(eq(products.id, item.productId))

            // Create inventory adjustment
            await tx.insert(inventoryAdjustments)
              .values({
                productId: item.productId,
                quantity: -item.quantity,
                changeType: 'ORDER_PLACED',
                reason: `Inventory reduced for order ${orderId}`,
                referenceId: orderId,
              })
          }

          // Fetch complete order with relations
          const completeOrder = await db.query.orders.findFirst({
            where: eq(orders.id, newOrder.id),
            with: {
              items: {
                with: {
                  product: true
                }
              },
              user: true
            }
          })

          return completeOrder
        })

        // Send confirmation email if user email is available
        const userEmail = isGuest ? guestEmail : token?.email
        if (userEmail) {
          try {
            // Create a minimal user object for the email service
            const user = {
              id: userId || 'guest',
              name: token?.name || 'Guest Customer',
              email: userEmail,
            } as any // Type assertion to bypass strict type checking

            await EmailService.sendOrderConfirmation({
              order,
              user,
              orderItems: order.items.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
              })),
            })
          } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError)
            // Don't fail the order if email fails
          }
        }

        return NextResponse.json({
          success: true,
          orderId: order.id,
          transactionId: paymentResult.transactionId,
          method,
          amount: summary.total,
          orderCreated: true,
        })
      } catch (orderError) {
        return NextResponse.json(
          { error: 'Payment successful but order creation failed' },
          { status: 500 }
        )
      }
    }

    // For online payments (eSewa, Khalti), store session data for later order creation
    const sessionData = {
      orderId,
      userId: userId || null,
      guestEmail: isGuest ? guestEmail : null,
      cartItems: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price,
      })),
      method,
      amount: summary.total,
      shippingAddress: shippingAddress || null,
    }

    // Store session data in memory for retrieval after payment verification
    paymentSessions.set(orderId, {
      userId: userId || null,
      guestEmail: isGuest ? guestEmail : null,
      cartItems: cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.discountPrice || item.product.price,
      })),
      amount: summary.total,
      shippingAddress: shippingAddress || null,
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
      orderId,
      method,
      amount: summary.total,
      sessionData, // Include for frontend to store temporarily
      orderCreated: false, // Will be created after payment verification
    })

  } catch (error) {
    
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
}