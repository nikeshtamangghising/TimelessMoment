import { NextRequest, NextResponse } from 'next/server'
import { retrievePaymentIntent } from '@/lib/stripe'
import { createAuthHandler } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return createAuthHandler(async (req: NextRequest) => {
    try {
      const resolvedParams = await params
      const paymentIntent = await retrievePaymentIntent(resolvedParams.id)

    // Return only safe, non-sensitive information
    return NextResponse.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: paymentIntent.created,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
    })

  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  })(request)
}
