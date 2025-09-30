import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// Client-side Stripe configuration
export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables')
  }
  return key
}

// Stripe webhook signature verification
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string
): Stripe.Event => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables')
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    throw new Error('Invalid webhook signature')
  }
}

// Create payment intent
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw new Error('Failed to create payment intent')
  }
}

// Retrieve payment intent
export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    throw new Error('Failed to retrieve payment intent')
  }
}

// Update payment intent
export const updatePaymentIntent = async (
  paymentIntentId: string,
  params: Stripe.PaymentIntentUpdateParams
): Promise<Stripe.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.update(paymentIntentId, params)
  } catch (error) {
    console.error('Error updating payment intent:', error)
    throw new Error('Failed to update payment intent')
  }
}

// Create customer
export const createCustomer = async (
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> => {
  try {
    return await stripe.customers.create({
      email,
      name,
      metadata,
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    throw new Error('Failed to create customer')
  }
}

// Retrieve customer
export const retrieveCustomer = async (
  customerId: string
): Promise<Stripe.Customer> => {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) {
      throw new Error('Customer has been deleted')
    }
    return customer as Stripe.Customer
  } catch (error) {
    console.error('Error retrieving customer:', error)
    throw new Error('Failed to retrieve customer')
  }
}

// Format amount for display
export const formatStripeAmount = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

// Validate webhook event type
export const isValidWebhookEvent = (event: Stripe.Event, expectedTypes: string[]): boolean => {
  return expectedTypes.includes(event.type)
}

// Extract metadata from Stripe object
export const extractMetadata = (stripeObject: { metadata?: Record<string, string> }): Record<string, string> => {
  return stripeObject.metadata || {}
}

// Error handling for Stripe errors
export const handleStripeError = (error: unknown): string => {
  if (error instanceof Stripe.errors.StripeCardError) {
    return error.message || 'Your card was declined'
  }
  
  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return 'Too many requests. Please try again later'
  }
  
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return 'Invalid request. Please check your information'
  }
  
  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    return 'Authentication failed'
  }
  
  if (error instanceof Stripe.errors.StripeConnectionError) {
    return 'Network error. Please try again'
  }
  
  if (error instanceof Stripe.errors.StripeAPIError) {
    return 'Payment processing error. Please try again'
  }
  
  if (error instanceof Stripe.errors.StripeError) {
    return error.message || 'An unexpected error occurred'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unknown error occurred'
}
