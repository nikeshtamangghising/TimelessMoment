'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { PaymentMethod } from '@/lib/payment-gateways'
import PaymentMethodSelector from './payment-method-selector'
import Button from '@/components/ui/button'

interface CheckoutFormProps {
  onSuccess: (paymentMethod: PaymentMethod, transactionId?: string) => void
  onError: (error: string) => void
  orderTotal: number
  isGuest?: boolean
  guestEmail?: string
  onGuestEmailChange?: (email: string) => void
  onPaymentInitiate?: (method: PaymentMethod) => Promise<{ success: boolean; paymentUrl?: string; error?: string }>
}

export default function CheckoutForm({ 
  onSuccess, 
  onError, 
  orderTotal, 
  isGuest, 
  guestEmail, 
  onGuestEmailChange,
  onPaymentInitiate 
}: CheckoutFormProps) {
  const { user } = useAuth()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || guestEmail || '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedPaymentMethod) {
      setMessage('Please select a payment method')
      onError('Please select a payment method')
      return
    }

    // Validate required fields
    if (!customerInfo.name || !customerInfo.email || !customerInfo.address) {
      setMessage('Please fill in all required fields')
      onError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      if (selectedPaymentMethod === 'cod') {
        // For COD, we don't need payment gateway interaction
        setMessage('Order placed successfully! You will pay on delivery.')
        onSuccess(selectedPaymentMethod, `cod-${Date.now()}`)
      } else if (onPaymentInitiate) {
        // For online payment methods, initiate payment
        const result = await onPaymentInitiate(selectedPaymentMethod)
        
        if (result.success && result.paymentUrl) {
          // Redirect to payment gateway
          window.location.href = result.paymentUrl
        } else {
          throw new Error(result.error || 'Failed to initiate payment')
        }
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
      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={customerInfo.email}
              onChange={(e) => {
                setCustomerInfo({ ...customerInfo, email: e.target.value })
                onGuestEmailChange?.(e.target.value)
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your email address"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
      </div>
      
      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Shipping Address
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              id="address"
              type="text"
              required
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your street address"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                id="city"
                type="text"
                value={customerInfo.city}
                onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your city"
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                id="postalCode"
                type="text"
                value={customerInfo.postalCode}
                onChange={(e) => setCustomerInfo({ ...customerInfo, postalCode: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter postal code"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <PaymentMethodSelector
        selectedMethod={selectedPaymentMethod}
        onMethodSelect={setSelectedPaymentMethod}
        orderTotal={orderTotal}
        disabled={isLoading}
      />

      {/* Error Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('succeeded') || message.includes('successfully')
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !selectedPaymentMethod}
        loading={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : 
         selectedPaymentMethod === 'cod' ? 'Place Order (COD)' :
         selectedPaymentMethod ? `Pay with ${selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1)}` :
         'Select Payment Method'}
      </Button>

      {/* Payment Security Info */}
      <div className="text-sm text-gray-500 space-y-2">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Your information is encrypted and secure
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Multiple secure payment options available
        </div>
      </div>
    </form>
  )
}