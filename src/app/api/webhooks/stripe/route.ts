import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyWebhookSignature, isValidWebhookEvent, extractMetadata } from '@/lib/stripe'
import { createOrder, updateOrderStatus } from '@/lib/db-utils'
import { productRepository } from '@/lib/product-repository'
import { EmailService } from '@/lib/email-service'
import { prisma } from '@/lib/db-utils'
import Stripe from 'stripe'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

const WEBHOOK_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = verifyWebhookSignature(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Validate event type
    if (!isValidWebhookEvent(event, WEBHOOK_EVENTS)) {
      console.log(`Unhandled event type: ${event.type}`)
      return NextResponse.json({ received: true })
    }

    console.log(`Processing webhook event: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment succeeded: ${paymentIntent.id}`)

    const metadata = extractMetadata(paymentIntent)
    const orderItems = JSON.parse(metadata.orderItems || '[]')

    if (!orderItems.length) {
      console.error('No order items found in payment intent metadata')
      return
    }

    // Create order in database
    const orderData = {
      userId: metadata.userId || '', // This should be set when creating payment intent
      items: orderItems.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(metadata.subtotal || '0') / orderItems.length, // Simplified price calculation
      })),
      total: paymentIntent.amount / 100, // Convert from cents
      stripePaymentIntentId: paymentIntent.id,
    }

    const order = await createOrder(orderData)
    console.log(`Order created: ${order.id}`)

    // Update inventory for each product
    for (const item of orderItems) {
      try {
        await productRepository.updateInventory(item.productId, item.quantity)
        console.log(`Updated inventory for product ${item.productId}: -${item.quantity}`)
      } catch (error) {
        console.error(`Failed to update inventory for product ${item.productId}:`, error)
        // Continue processing other items even if one fails
      }
    }

    // Send order confirmation email
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: metadata.userId }
      })

      if (user) {
        // Get product details for email
        const orderItemsWithProducts = await Promise.all(
          orderItems.map(async (item: any) => {
            const product = await productRepository.findById(item.productId)
            return {
              product: product!,
              quantity: item.quantity,
              price: product!.price
            }
          })
        )

        // Send order confirmation email
        await EmailService.sendOrderConfirmation({
          order,
          user,
          orderItems: orderItemsWithProducts
        }, true) // Use queue for better performance

        console.log(`Order confirmation email sent to ${user.email}`)
      } else {
        console.error(`User not found for order confirmation: ${metadata.userId}`)
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
      // Don't throw error - order was successful even if email failed
    }

  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment failed: ${paymentIntent.id}`)

    // TODO: Handle payment failure
    // - Log the failure
    // - Potentially notify the customer
    // - Update any relevant order status if order was already created

    const metadata = extractMetadata(paymentIntent)
    console.log('Payment failure metadata:', metadata)

    // Send payment failure notification email
    try {
      if (metadata.userId) {
        const user = await prisma.user.findUnique({
          where: { id: metadata.userId }
        })

        if (user) {
          // Send payment failure notification
          await EmailService.sendPaymentFailureNotification({
            user,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
          }, true)

          console.log(`Payment failure notification sent to ${user.email}`)
        }
      }
    } catch (emailError) {
      console.error('Failed to send payment failure notification:', emailError)
    }

  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`Payment canceled: ${paymentIntent.id}`)

    // TODO: Handle payment cancellation
    // - Log the cancellation
    // - Clean up any temporary data
    // - Restore inventory if needed

    const metadata = extractMetadata(paymentIntent)
    console.log('Payment cancellation metadata:', metadata)

  } catch (error) {
    console.error('Error handling payment canceled:', error)
    throw error
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhook: 'stripe',
  })
}