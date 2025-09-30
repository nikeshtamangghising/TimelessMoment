import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import Stripe from 'stripe'
import {
  formatStripeAmount,
  isValidWebhookEvent,
  extractMetadata,
  handleStripeError,
} from '@/lib/stripe'

// Mock Stripe
jest.mock('stripe')

describe('Stripe Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('formatStripeAmount', () => {
    it('should format amount correctly in USD', () => {
      expect(formatStripeAmount(9999)).toBe('$99.99')
      expect(formatStripeAmount(1000)).toBe('$10.00')
      expect(formatStripeAmount(50)).toBe('$0.50')
    })

    it('should format amount in different currencies', () => {
      expect(formatStripeAmount(9999, 'eur')).toBe('€99.99')
      expect(formatStripeAmount(9999, 'gbp')).toBe('£99.99')
    })

    it('should handle zero amount', () => {
      expect(formatStripeAmount(0)).toBe('$0.00')
    })
  })

  describe('isValidWebhookEvent', () => {
    const mockEvent = { type: 'payment_intent.succeeded' } as Stripe.Event

    it('should return true for valid event types', () => {
      const validTypes = ['payment_intent.succeeded', 'payment_intent.payment_failed']
      expect(isValidWebhookEvent(mockEvent, validTypes)).toBe(true)
    })

    it('should return false for invalid event types', () => {
      const validTypes = ['payment_intent.payment_failed', 'customer.created']
      expect(isValidWebhookEvent(mockEvent, validTypes)).toBe(false)
    })

    it('should handle empty valid types array', () => {
      expect(isValidWebhookEvent(mockEvent, [])).toBe(false)
    })
  })

  describe('extractMetadata', () => {
    it('should extract metadata from Stripe object', () => {
      const stripeObject = {
        metadata: {
          orderId: '123',
          userId: '456',
        },
      }

      const result = extractMetadata(stripeObject)
      expect(result).toEqual({
        orderId: '123',
        userId: '456',
      })
    })

    it('should return empty object when no metadata', () => {
      const stripeObject = {}
      const result = extractMetadata(stripeObject)
      expect(result).toEqual({})
    })

    it('should return empty object when metadata is undefined', () => {
      const stripeObject = { metadata: undefined }
      const result = extractMetadata(stripeObject)
      expect(result).toEqual({})
    })
  })

  describe('handleStripeError', () => {
    it('should handle card errors', () => {
      const cardError = new Stripe.errors.StripeCardError({
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined',
      })

      expect(handleStripeError(cardError)).toBe('Your card was declined')
    })

    it('should handle rate limit errors', () => {
      const rateLimitError = new Stripe.errors.StripeRateLimitError({
        type: 'rate_limit_error',
      })

      expect(handleStripeError(rateLimitError)).toBe('Too many requests. Please try again later')
    })

    it('should handle invalid request errors', () => {
      const invalidRequestError = new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        message: 'Invalid request',
      })

      expect(handleStripeError(invalidRequestError)).toBe('Invalid request. Please check your information')
    })

    it('should handle authentication errors', () => {
      const authError = new Stripe.errors.StripeAuthenticationError({
        type: 'authentication_error',
      })

      expect(handleStripeError(authError)).toBe('Authentication failed')
    })

    it('should handle API connection errors', () => {
      const connectionError = new Stripe.errors.StripeConnectionError({
        type: 'api_connection_error',
      })

      expect(handleStripeError(connectionError)).toBe('Network error. Please try again')
    })

    it('should handle API errors', () => {
      const apiError = new Stripe.errors.StripeAPIError({
        type: 'api_error',
      })

      expect(handleStripeError(apiError)).toBe('Payment processing error. Please try again')
    })

    it('should handle unknown Stripe errors', () => {
      const unknownError = new Stripe.errors.StripeError({
        type: 'unknown_error' as any,
      })

      expect(handleStripeError(unknownError)).toBe('An unexpected error occurred')
    })

    it('should handle generic Error objects', () => {
      const genericError = new Error('Generic error message')
      expect(handleStripeError(genericError)).toBe('Generic error message')
    })

    it('should handle unknown error types', () => {
      const unknownError = 'string error'
      expect(handleStripeError(unknownError)).toBe('An unknown error occurred')
    })
  })
})