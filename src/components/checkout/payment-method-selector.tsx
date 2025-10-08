'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PaymentMethod, getAvailablePaymentMethods, getPaymentMethodInfo, formatCurrency } from '@/lib/payment-gateways'

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null
  onMethodSelect: (method: PaymentMethod) => void
  orderTotal: number
  disabled?: boolean
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  orderTotal,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const paymentMethods = getAvailablePaymentMethods()
  
  const handleMethodChange = (method: PaymentMethod) => {
    if (!disabled) {
      onMethodSelect(method)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
      <p className="text-sm text-gray-600">
        Choose your preferred payment method to complete your order.
      </p>

      <div className="space-y-3">
        {paymentMethods.map((method) => {
          const methodInfo = getPaymentMethodInfo(method)
          const isSelected = selectedMethod === method

          return (
            <div
              key={method}
              className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-600 bg-indigo-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleMethodChange(method)}
            >
              <div className="flex items-center space-x-3">
                {/* Radio Button */}
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>

                {/* Payment Method Icon */}
                <div className="flex-shrink-0">
                  {method === 'esewa' && (
                    <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">eSewa</span>
                    </div>
                  )}
                  {method === 'khalti' && (
                    <div className="w-12 h-8 bg-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Khalti</span>
                    </div>
                  )}
                  {method === 'cod' && (
                    <div className="w-12 h-8 bg-orange-600 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Payment Method Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {methodInfo.displayName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {getPaymentMethodDescription(method)}
                      </p>
                    </div>
                    {methodInfo.isOnline && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Online
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-px -right-px rounded-tr-lg rounded-bl-lg bg-indigo-600 text-white p-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700">Order Total:</span>
                    <span className="font-semibold text-indigo-900">
                      {formatCurrency(orderTotal)}
                    </span>
                  </div>
                  {method === 'cod' && (
                    <p className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                      <strong>Note:</strong> You will pay in cash when your order is delivered. 
                      Please keep the exact amount ready.
                    </p>
                  )}
                  {method === 'esewa' && (
                    <p className="mt-2 text-xs text-green-700">
                      You will be redirected to eSewa to complete your payment securely.
                    </p>
                  )}
                  {method === 'khalti' && (
                    <p className="mt-2 text-xs text-purple-700">
                      You will be redirected to Khalti to complete your payment securely.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment Security Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-gray-900">Secure Payment</span>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Your payment information is encrypted and secure
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Multiple payment options available
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Easy refunds and 30-day return policy
          </div>
        </div>
      </div>
    </div>
  )
}

function getPaymentMethodDescription(method: PaymentMethod): string {
  const descriptions = {
    esewa: 'Pay securely with your eSewa wallet',
    khalti: 'Pay with Khalti wallet or mobile banking',
    cod: 'Pay in cash when your order is delivered',
  }
  return descriptions[method] || ''
}

// Export payment method icons for use in other components
export function PaymentMethodIcon({ method, size = 'sm' }: { method: PaymentMethod; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    xs: 'w-6 h-4',
    sm: 'w-8 h-6',
    md: 'w-12 h-8',
    lg: 'w-16 h-10',
  }

  const className = `${sizeClasses[size]} rounded flex items-center justify-center text-white text-xs font-bold`

  switch (method) {
    case 'esewa':
      return (
        <div className={`${className} bg-green-600`}>
          eSewa
        </div>
      )
    case 'khalti':
      return (
        <div className={`${className} bg-purple-600`}>
          Khalti
        </div>
      )
    case 'cod':
      return (
        <div className={`${className} bg-orange-600`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        </div>
      )
    default:
      return null
  }
}