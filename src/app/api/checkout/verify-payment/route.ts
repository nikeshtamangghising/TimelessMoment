import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPaymentGatewayManager, parseESewaCallback, parseKhaltiCallback } from '@/lib/payment-gateways'
import { prisma } from '@/lib/db'
import { productRepository } from '@/lib/product-repository'
import { EmailService } from '@/lib/email-service'

// In-memory storage for session data (in production, use Redis or database)
const paymentSessions = new Map<string, any>()

const verifyPaymentSchema = z.object({
  method: z.enum(['esewa', 'khalti', 'cod']),
  transactionId: z.string(),
  orderId: z.string(),
  // Additional data for different payment methods
  esewaData: z.object({
    oid: z.string(),
    amt: z.string(),
    refId: z.string(),
  }).optional(),
  khaltiData: z.object({
    pidx: z.string(),
  }).optional(),
  codData: z.object({
    amount: z.number(),
  }).optional(),
  // Session data that should have been stored during payment initiation
  sessionData: z.object({
    userId: z.string().nullable(),
    guestEmail: z.string().email().nullable(),
    cartItems: z.array(z.object({
      productId: z.string(),
      quantity: z.number(),
      price: z.number(),
    })),
    amount: z.number(),
    shippingAddress: z.any().optional(), // Allow any JSON structure for shipping address
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = verifyPaymentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { method, transactionId, orderId, esewaData, khaltiData, codData, sessionData } = validationResult.data

    // Get payment gateway manager
    const paymentManager = getPaymentGatewayManager()

    // Verify payment based on method
    let verificationResult
    
    switch (method) {
      case 'esewa':
        if (!esewaData) {
          return NextResponse.json(
            { error: 'eSewa verification data required' },
            { status: 400 }
          )
        }
        verificationResult = await paymentManager.verifyPayment(method, transactionId, esewaData)
        break
        
      case 'khalti':
        if (!khaltiData) {
          return NextResponse.json(
            { error: 'Khalti verification data required' },
            { status: 400 }
          )
        }
        verificationResult = await paymentManager.verifyPayment(method, khaltiData.pidx)
        break
        
      case 'cod':
        if (!codData) {
          return NextResponse.json(
            { error: 'COD verification data required' },
            { status: 400 }
          )
        }
        verificationResult = await paymentManager.verifyPayment(method, transactionId, {
          orderId,
          amount: codData.amount,
        })
        break
        
      default:
        return NextResponse.json(
          { error: `Unsupported payment method: ${method}` },
          { status: 400 }
        )
    }

    if (!verificationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: verificationResult.error || 'Payment verification failed',
          orderId,
          transactionId,
        },
        { status: 400 }
      )
    }

    // Payment verified successfully - now create the order
    try {
      // Get session data - either from request body or from in-memory storage
      let orderSessionData = sessionData
      
      // If not provided in request, try to get from in-memory storage
      if (!orderSessionData && paymentSessions.has(orderId)) {
        orderSessionData = paymentSessions.get(orderId)
        // Remove from storage after retrieval
        paymentSessions.delete(orderId)
      }
      
      // If we still don't have session data, we can't create the order
      if (!orderSessionData) {
        console.warn('Order creation skipped: Session data not available')
        console.warn('OrderId:', verificationResult.orderId)
        return NextResponse.json({
          success: true,
          orderId: verificationResult.orderId,
          transactionId: verificationResult.transactionId,
          amount: verificationResult.amount,
          method: verificationResult.method,
          warning: 'Order not created - session data unavailable',
        })
      }

      // Create the order
      const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            id: orderId,
            userId: orderSessionData.userId,
            total: orderSessionData.amount,
            status: 'PENDING',
            stripePaymentIntentId: transactionId,
            shippingAddress: orderSessionData.shippingAddress ? orderSessionData.shippingAddress : undefined,
            items: {
              create: orderSessionData.cartItems.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
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
        for (const item of orderSessionData.cartItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                decrement: item.quantity
              }
            }
          })

          // Record inventory adjustment
          await tx.inventoryAdjustment.create({
            data: {
              productId: item.productId,
              quantity: -item.quantity,
              type: 'ORDER_PLACED',
              reason: `Inventory reduced for order ${newOrder.id}`,
            }
          })
        }

        return newOrder
      })

      // Send confirmation email if user email is available
      const userEmail = orderSessionData.guestEmail || order.user?.email
      if (userEmail) {
        try {
          await EmailService.sendOrderConfirmation({
            order: order,
            user: order.user || {
              id: 'guest',
              name: 'Guest Customer',
              email: userEmail,
            } as any,
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
        transactionId: verificationResult.transactionId,
        amount: verificationResult.amount,
        method: verificationResult.method,
        orderCreated: true,
      })

    } catch (error) {
      console.error('Error processing verified payment:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment verified but order processing failed',
          orderId,
          transactionId,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error verifying payment:', error)
    
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

// GET endpoint for handling payment gateway callbacks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')
    
    if (!method || !['esewa', 'khalti'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    let parsedData
    
    if (method === 'esewa') {
      parsedData = parseESewaCallback(Object.fromEntries(searchParams.entries()))
      
      // Redirect to success/failure page based on eSewa callback
      const { oid, amt, refId } = parsedData
      
      if (oid && amt && refId) {
        // Success - redirect to verification
        const successUrl = new URL('/checkout/success', request.url)
        successUrl.searchParams.set('method', 'esewa')
        successUrl.searchParams.set('oid', oid)
        successUrl.searchParams.set('amt', amt)
        successUrl.searchParams.set('refId', refId)
        
        return NextResponse.redirect(successUrl.toString())
      } else {
        // Failure - redirect to failure page
        const failureUrl = new URL('/checkout/failure', request.url)
        failureUrl.searchParams.set('method', 'esewa')
        failureUrl.searchParams.set('error', 'Payment failed or cancelled')
        
        return NextResponse.redirect(failureUrl.toString())
      }
    } else if (method === 'khalti') {
      parsedData = parseKhaltiCallback(Object.fromEntries(searchParams.entries()))
      
      // Redirect to success/failure page based on Khalti callback
      const { pidx, status, transaction_id } = parsedData
      
      if (pidx && status && transaction_id) {
        // Success - redirect to verification
        const successUrl = new URL('/checkout/success', request.url)
        successUrl.searchParams.set('method', 'khalti')
        successUrl.searchParams.set('pidx', pidx)
        successUrl.searchParams.set('status', status)
        successUrl.searchParams.set('transaction_id', transaction_id)
        
        return NextResponse.redirect(successUrl.toString())
      } else {
        // Failure - redirect to failure page
        const failureUrl = new URL('/checkout/failure', request.url)
        failureUrl.searchParams.set('method', 'khalti')
        failureUrl.searchParams.set('error', 'Payment failed or cancelled')
        
        return NextResponse.redirect(failureUrl.toString())
      }
    }

    return NextResponse.json(
      { error: 'Invalid payment callback' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error handling payment callback:', error)
    
    // Redirect to failure page on error
    const failureUrl = new URL('/checkout/failure', request.url)
    failureUrl.searchParams.set('error', 'Payment processing error')
    
    return NextResponse.redirect(failureUrl.toString())
  }
}