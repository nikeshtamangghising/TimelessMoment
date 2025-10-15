import Stripe from 'stripe'

// Helper function to extract metadata from payment intent
function extractMetadata(paymentIntent: Stripe.PaymentIntent): Record<string, string> {
  return paymentIntent.metadata || {}
}

export interface WebhookProcessingResult {
  success: boolean
  message: string
  orderId?: string
  error?: string
}

export interface OrderItemData {
  productId: string
  quantity: number
  price: number
}

export interface WebhookOrderData {
  userId: string
  items: OrderItemData[]
  total: number
  stripePaymentIntentId: string
  metadata: Record<string, string>
}

export function parsePaymentIntentMetadata(paymentIntent: Stripe.PaymentIntent): {
  orderItems: OrderItemData[]
  userId: string
  subtotal: number
  shipping: number
  tax: number
} {
  const metadata = extractMetadata(paymentIntent)
  
  let orderItems: OrderItemData[] = []
  try {
    orderItems = JSON.parse(metadata.orderItems || '[]')
  } catch (error) {
    console.error('Failed to parse order items from metadata:', error)
  }

  return {
    orderItems,
    userId: metadata.userId || '',
    subtotal: parseFloat(metadata.subtotal || '0'),
    shipping: parseFloat(metadata.shipping || '0'),
    tax: parseFloat(metadata.tax || '0'),
  }
}

export function validateWebhookPayload(paymentIntent: Stripe.PaymentIntent): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!paymentIntent.id) {
    errors.push('Missing payment intent ID')
  }

  if (!paymentIntent.amount || paymentIntent.amount <= 0) {
    errors.push('Invalid payment amount')
  }

  const metadata = extractMetadata(paymentIntent)
  
  if (!metadata.orderItems) {
    errors.push('Missing order items in metadata')
  } else {
    try {
      const items = JSON.parse(metadata.orderItems)
      if (!Array.isArray(items) || items.length === 0) {
        errors.push('Invalid or empty order items')
      }
    } catch (error) {
      errors.push('Invalid order items format')
    }
  }

  if (!metadata.userId) {
    errors.push('Missing user ID in metadata')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function calculateOrderItemPrices(
  orderItems: { productId: string; quantity: number }[],
  subtotal: number
): OrderItemData[] {
  // Simple proportional distribution of subtotal across items
  // In a real application, you'd want to store individual prices in metadata
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  
  return orderItems.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: (subtotal / totalQuantity) * item.quantity,
  }))
}

export function createWebhookOrderData(paymentIntent: Stripe.PaymentIntent): WebhookOrderData {
  const { orderItems, userId, subtotal, shipping, tax } = parsePaymentIntentMetadata(paymentIntent)
  
  // Calculate individual item prices
  const itemsWithPrices = calculateOrderItemPrices(orderItems, subtotal)
  
  return {
    userId,
    items: itemsWithPrices,
    total: paymentIntent.amount / 100, // Convert from cents
    stripePaymentIntentId: paymentIntent.id,
    metadata: extractMetadata(paymentIntent),
  }
}

export function logWebhookEvent(
  eventType: string,
  paymentIntentId: string,
  result: WebhookProcessingResult
) {
  const logData = {
    timestamp: new Date().toISOString(),
    eventType,
    paymentIntentId,
    success: result.success,
    message: result.message,
    orderId: result.orderId,
    error: result.error,
  }

  if (result.success) {
  } else {
    console.error('Webhook processing failed:', logData)
  }
}

export function shouldRetryWebhook(error: unknown): boolean {
  // Determine if the webhook should be retried based on the error type
  if (error instanceof Error) {
    // Retry on temporary errors
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ]
    
    return retryableErrors.some(code => error.message.includes(code))
  }
  
  return false
}

export function getWebhookRetryDelay(attemptNumber: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 16000)
}

export async function processWebhookWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !shouldRetryWebhook(error)) {
        throw error
      }
      
      const delay = getWebhookRetryDelay(attempt)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}