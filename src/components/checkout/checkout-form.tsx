'use client'

import { useState } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js'
import Button from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

interface CheckoutFormProps {
  onSuccess: () => void
  onError: (error: string) => void
}

export default function CheckoutForm({ onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: user?.email,
        },
        redirect: 'if_required',
      })

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'Payment failed')
          onError(error.message || 'Payment failed')
        } else {
          setMessage('An unexpected error occurred')
          onError('An unexpected error occurred')
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment succeeded!')
        onSuccess()
      } else {
        setMessage('Payment processing...')
      }
    } catch (err) {
      console.error('Payment error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setMessage(errorMessage)
      onError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Shipping Address
        </h3>
        <AddressElement
          options={{
            mode: 'shipping',
            allowedCountries: ['US', 'CA'],
          }}
        />
      </div>

      {/* Payment Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Payment Details
        </h3>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('succeeded') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        loading={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : 'Complete Payment'}
      </Button>

      {/* Payment Security Info */}
      <div className="text-sm text-gray-500 space-y-2">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your payment information is encrypted and secure
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Protected by Stripe's advanced fraud detection
        </div>
      </div>
    </form>
  )
}