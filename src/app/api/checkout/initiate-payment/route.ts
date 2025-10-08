import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'
import { getPaymentGatewayManager, PaymentMethod } from '@/lib/payment-gateways'
import { getCartSummaryWithSettings } from '@/lib/cart-utils'
import { productRepository } from '@/lib/product-repository'
import { orderRepository } from '@/lib/order-repository'
import { EmailService } from '@/lib/email-service'
import { prisma } from '@/lib/db'

const initiatePaymentSchema = z.object({
  method: z.enum(['esewa', 'khalti', 'cod']),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).min(1, 'Cart must have at least one item'),
  guestEmail: z.string().email().optional(),
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

    const { method, items, guestEmail } = validationResult.data
    
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

        const orderData = {
          userId: userId || null,
          guestEmail: isGuest ? guestEmail : null,
          total: summary.total,
          status: 'PENDING' as const,
          paymentMethod: 'cod' as const,
          transactionId: paymentResult.transactionId,
          items: orderItems,
        }

        // Create order in database
        // Note: For guest users, we'll create a temporary user record or use a default guest user
        let actualUserId = userId
        if (!userId && isGuest) {
          // For guest orders, we'll need to create a guest user or use a system guest user ID
          // For now, let's skip guest orders and require authentication
          return NextResponse.json(
            { error: 'Guest orders require user authentication. Please sign in to continue.' },
            { status: 400 }
          )
        }

        const order = await prisma.order.create({
          data: {
            id: orderId,
            userId: actualUserId!,
            total: orderData.total,
            status: orderData.status,
            stripePaymentIntentId: orderData.transactionId, // Store transaction ID here for now
            items: {
              create: orderData.items,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
          },
        })

        // Update product inventory
        for (const item of cartItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                decrement: item.quantity
              }
            }
          })
        }

        // Send confirmation email if user email is available
        const userEmail = isGuest ? guestEmail : token?.email
        if (userEmail) {
          try {
            const user = {
              id: userId || 'guest',
              name: token?.name || 'Guest Customer',
              email: userEmail,
            }

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
        console.error('Error creating COD order:', orderError)
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
      items: items,
      cartItems,
      method,
      amount: summary.total,
      transactionId: paymentResult.transactionId,
    }

    // TODO: Store session data in Redis or database for retrieval after payment verification
    // For now, we'll include it in the response for frontend storage

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
    console.error('Error initiating payment:', error)
    
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