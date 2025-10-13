"use client"

import { Suspense, useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/admin-layout'
import AdminProtectedRoute from '@/components/admin/admin-protected-route'
import Loading from '@/components/ui/loading'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Button from '@/components/ui/button'

interface CustomerDetail {
  id: string
  name: string
  email: string
  joinedAt: string
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  role: string
  emailVerified?: string
  orders: Array<{
    id: string
    total: number
    status: string
    createdAt: string
  }>
}

function CustomerDetailContent({ id }: { id: string }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/customers/${id}`)
        if (!res.ok) throw new Error('Failed to fetch customer')
        const data = await res.json()
        setCustomer(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load customer')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loading size="lg" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to load customer</h2>
          <p className="text-gray-600">{error || 'Customer not found'}</p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (s: string) => new Date(s).toLocaleString()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name || 'Customer'}</h1>
          <p className="text-gray-600">{customer.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/customers/export?format=csv`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Export</Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Joined</div>
            <div className="text-xl font-semibold text-gray-900">{formatDate(customer.joinedAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-xl font-semibold text-gray-900">{customer.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Total Spent</div>
            <div className="text-xl font-semibold text-gray-900">{customer.totalSpent}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <div className="text-sm text-gray-500">No orders</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customer.orders.map(o => (
                    <tr key={o.id}>
                      <td className="px-6 py-4 text-sm font-mono">{o.id}</td>
                      <td className="px-6 py-4 text-sm">{o.total}</td>
                      <td className="px-6 py-4 text-sm">{o.status}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <Suspense fallback={
      <AdminProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loading size="lg" />
              <div className="mt-4 text-gray-600">Loading customer...</div>
            </div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    }>
      <AdminProtectedRoute>
        <AdminLayout>
          <CustomerDetailContent id={id} />
        </AdminLayout>
      </AdminProtectedRoute>
    </Suspense>
  )
}
