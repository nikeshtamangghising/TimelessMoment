'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/main-layout'
import AddressList from '@/components/addresses/address-list'
// AddressForm will be used for future inline editing
// import AddressForm from '@/components/addresses/address-form'
import { Address } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

export default function AddressesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/addresses')
      return
    }

    if (isAuthenticated) {
      fetchAddresses()
    }
  }, [isAuthenticated, isLoading, router])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      // Load addresses from localStorage as temporary solution
      const stored = JSON.parse(localStorage.getItem('userAddresses') || '[]')
      setAddresses(stored)
      setError(null)
    } catch (error) {
      setError('Failed to fetch addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressUpdate = () => {
    fetchAddresses() // Refresh the list after updates
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to signin
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Address Book</h1>
          <p className="mt-2 text-gray-600">
            Manage your shipping and billing addresses
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Shipping Addresses */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Addresses</h2>
            <AddressList
              type="SHIPPING"
              showCreateNew={true}
              onCreateNew={handleAddressUpdate}
            />
          </div>

          {/* Billing Addresses */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Addresses</h2>
            <AddressList
              type="BILLING"
              showCreateNew={true}
              onCreateNew={handleAddressUpdate}
            />
          </div>

          {addresses.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
              <p className="text-gray-500 mb-4">
                Add your first address to make checkout faster and easier.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
