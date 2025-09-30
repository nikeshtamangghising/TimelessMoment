import { describe, it, expect, jest } from '@jest/globals'
import Stripe from 'stripe'
import {
  parsePaymentIntentMetadata,
  validateWebhookPayload,
  calculateOrderItemPrices,
  createWebhookOrderData,
  shouldRetryWebhook,
  getWebhookRetryDelay,
} from '@/lib/webhook-utils'

describe('Webhook Utils', () => {
  const mockPaymentIntent: Stripe.PaymentIntent = {
    id: 'pi_test123',
    amount: 11923, // $119.23 in cents
    currency: 'usd',
    status: 'succeeded',
    metadata: {
      orderItems: JSON.stringify([
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ]),
      userId: 'user123',
      subtotal: '99.99',
      shipping: '9.99',
      tax: '9.25',
    },
  } as Stripe.PaymentIntent

  describe('parsePaymentIntentMetadata', () => {
    it('should parse metadata correctly', () => {
      const result = parsePaymentIntentMetadata(mockPaymentIntent)

      expect(result.orderItems).toEqual([
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ])
      expect(result.userId).toBe('user123')
      expect(result.subtotal).toBe(99.99)
      expect(result.shipping).toBe(9.99)
      expect(result.tax).toBe(9.25)
    })

    it('should handle missing metadata gracefully', () => {
      const paymentIntentWithoutMetadata = {
        ...mockPaymentIntent,
        metadata: {},
      }

      const result = parsePaymentIntentMetadata(paymentIntentWithoutMetadata)

      expect(result.orderItems).toEqual([])
      expect(result.userId).toBe('')
      expect(result.subtotal).toBe(0)
      expect(result.shipping).toBe(0)
      expect(result.tax).toBe(0)
    })

    it('should handle invalid JSON in orderItems', () => {
      const paymentIntentWithInvalidJson = {
        ...mockPaymentIntent,
        metadata: {
          ...mockPaymentIntent.metadata,
          orderItems: 'invalid json',
        },
      }

      const result = parsePaymentIntentMetadata(paymentIntentWithInvalidJson)

      expect(result.orderItems).toEqual([])
    })
  })

  describe('validateWebhookPayload', () => {
    it('should validate correct payload', () => {
      const result = validateWebhookPayload(mockPaymentIntent)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing payment intent ID', () => {
      const invalidPaymentIntent = {
        ...mockPaymentIntent,
        id: '',
      }

      const result = validateWebhookPayload(invalidPaymentIntent)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing payment intent ID')
    })

    it('should detect invalid amount', () => {
      const invalidPaymentIntent = {
        ...mockPaymentIntent,
        amount: 0,
      }

      const result = validateWebhookPayload(invalidPaymentIntent)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid payment amount')
    })

    it('should detect missing order items', () => {
      const invalidPaymentIntent = {
        ...mockPaymentIntent,
        metadata: {
          ...mockPaymentIntent.metadata,
          orderItems: undefined,
        },
      }

      const result = validateWebhookPayload(invalidPaymentIntent)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing order items in metadata')
    })

    it('should detect missing user ID', () => {
      const invalidPaymentIntent = {
        ...mockPaymentIntent,
        metadata: {
          ...mockPaymentIntent.metadata,
          userId: undefined,
        },
      }

      const result = validateWebhookPayload(invalidPaymentIntent)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Missing user ID in metadata')
    })
  })

  describe('calculateOrderItemPrices', () => {
    it('should distribute subtotal proportionally', () => {
      const orderItems = [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ]
      const subtotal = 150

      const result = calculateOrderItemPrices(orderItems, subtotal)

      expect(result).toEqual([
        { productId: '1', quantity: 2, price: 100 }, // 2/3 of 150
        { productId: '2', quantity: 1, price: 50 },  // 1/3 of 150
      ])
    })

    it('should handle single item', () => {
      const orderItems = [
        { productId: '1', quantity: 1 },
      ]
      const subtotal = 99.99

      const result = calculateOrderItemPrices(orderItems, subtotal)

      expect(result).toEqual([
        { productId: '1', quantity: 1, price: 99.99 },
      ])
    })
  })

  describe('createWebhookOrderData', () => {
    it('should create order data correctly', () => {
      const result = createWebhookOrderData(mockPaymentIntent)

      expect(result.userId).toBe('user123')
      expect(result.total).toBe(119.23) // 11923 cents / 100
      expect(result.stripePaymentIntentId).toBe('pi_test123')
      expect(result.items).toHaveLength(2)
      expect(result.metadata).toEqual(mockPaymentIntent.metadata)
    })
  })

  describe('shouldRetryWebhook', () => {
    it('should retry on network errors', () => {
      const networkErrors = [
        new Error('ECONNRESET'),
        new Error('ENOTFOUND'),
        new Error('ECONNREFUSED'),
        new Error('ETIMEDOUT'),
      ]

      networkErrors.forEach(error => {
        expect(shouldRetryWebhook(error)).toBe(true)
      })
    })

    it('should not retry on other errors', () => {
      const otherErrors = [
        new Error('Validation failed'),
        new Error('Invalid data'),
        'String error',
        null,
      ]

      otherErrors.forEach(error => {
        expect(shouldRetryWebhook(error)).toBe(false)
      })
    })
  })

  describe('getWebhookRetryDelay', () => {
    it('should implement exponential backoff', () => {
      expect(getWebhookRetryDelay(1)).toBe(1000)   // 1s
      expect(getWebhookRetryDelay(2)).toBe(2000)   // 2s
      expect(getWebhookRetryDelay(3)).toBe(4000)   // 4s
      expect(getWebhookRetryDelay(4)).toBe(8000)   // 8s
      expect(getWebhookRetryDelay(5)).toBe(16000)  // 16s (max)
      expect(getWebhookRetryDelay(6)).toBe(16000)  // Still 16s (capped)
    })
  })
})