'use client'

import { useEffect, useState } from 'react'
import { getAvailablePaymentMethods, getPaymentMethodInfo } from '@/lib/payment-gateways'

export default function PaymentTestPage() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPaymentMethods = () => {
      try {
        const methods = getAvailablePaymentMethods()
        const methodInfo = methods.map(method => ({
          method,
          ...getPaymentMethodInfo(method)
        }))
        setPaymentMethods(methodInfo)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching payment methods:', error)
        setLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  if (loading) {
    return <div>Loading payment methods...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Payment Methods Test</h1>
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.method} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{method.displayName}</h2>
            <p>Method: {method.method}</p>
            <p>Is Online: {method.isOnline ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}