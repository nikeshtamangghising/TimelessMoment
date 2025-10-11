'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function OrderCreationTest() {
  const { data: session } = useSession()
  const [orderId, setOrderId] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [trackingLogs, setTrackingLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const createTestOrder = async () => {
    if (!session?.user?.id) {
      setMessage('Please sign in to create a test order')
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      // Create a test order
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              productId: 'cmghyfbgi0005jhve12q12jlx', // Replace with a valid product ID
              quantity: 1,
              price: 29.99,
            }
          ],
          total: 29.99,
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.order) {
        setOrderId(data.order.id)
        setOrderStatus(data.order.status)
        setMessage('Test order created successfully!')
      } else {
        setMessage(`Error creating order: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const getOrderDetails = async () => {
    if (!orderId) {
      setMessage('Please create an order first')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrderStatus(data.status)
        // Get tracking logs
        const trackingResponse = await fetch(`/api/orders/${orderId}/tracking`)
        if (trackingResponse.ok) {
          const trackingData = await trackingResponse.json()
          setTrackingLogs(trackingData)
        }
        setMessage('Order details retrieved successfully')
      } else {
        setMessage(`Error retrieving order: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!orderId) {
      setMessage('Please create an order first')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setOrderStatus(newStatus)
        setMessage(`Order status updated to ${newStatus}`)
        // Refresh tracking logs
        getOrderDetails()
      } else {
        setMessage(`Error updating order status: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const addTrackingLog = async () => {
    if (!orderId) {
      setMessage('Please create an order first')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/orders/${orderId}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: orderStatus,
          message: 'Test tracking log entry',
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage('Tracking log added successfully')
        // Refresh tracking logs
        getOrderDetails()
      } else {
        setMessage(`Error adding tracking log: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Order Creation Test</h1>
      
      {!session ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>Please sign in to test order creation</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Test Order</h2>
            <button
              onClick={createTestOrder}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test Order'}
            </button>
          </div>

          {orderId && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order ID</label>
                  <p className="mt-1 text-lg font-mono">{orderId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Status</label>
                  <p className="mt-1 text-lg">{orderStatus}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => updateOrderStatus('PROCESSING')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Set to Processing
                </button>
                <button
                  onClick={() => updateOrderStatus('SHIPPED')}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Set to Shipped
                </button>
                <button
                  onClick={() => updateOrderStatus('DELIVERED')}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Set to Delivered
                </button>
                <button
                  onClick={() => updateOrderStatus('CANCELLED')}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Set to Cancelled
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={getOrderDetails}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Refresh Details
                </button>
                <button
                  onClick={addTrackingLog}
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  Add Tracking Log
                </button>
              </div>
            </div>
          )}

          {trackingLogs.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Tracking Logs</h2>
              <div className="space-y-3">
                {trackingLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.status}
                        </span>
                        <p className="mt-2 text-gray-700">{log.message}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {message && (
        <div className={`mt-6 p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}