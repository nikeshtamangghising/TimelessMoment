'use client'

import { useState, useEffect } from 'react'
import { Address } from '@/types'
import AddressList from '@/components/addresses/address-list'
import Button from '@/components/ui/button'

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      // Load addresses from localStorage as temporary solution
      const stored = JSON.parse(localStorage.getItem('userAddresses') || '[]')
      setAddresses(stored)
      setError(null)
    } catch (error) {
      setError('Failed to fetch addresses')
      console.error('Error fetching addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressUpdate = () => {
    fetchAddresses() // Refresh the list after updates
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading addresses...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchAddresses}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Shipping Addresses */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Shipping Addresses</h4>
        <AddressList
          type="SHIPPING"
          showCreateNew={true}
          onCreateNew={handleAddressUpdate}
        />
      </div>

      {/* Billing Addresses */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Addresses</h4>
        <AddressList
          type="BILLING"
          showCreateNew={true}
          onCreateNew={handleAddressUpdate}
        />
      </div>

      {addresses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-500">
            Add your first address to make checkout faster and easier.
          </p>
        </div>
      )}

      {/* Address Management Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Address Management Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Set a default address for faster checkout</li>
          <li>• You can have multiple shipping and billing addresses</li>
          <li>• Addresses are automatically suggested during checkout</li>
          <li>• Keep your addresses up to date for accurate delivery</li>
        </ul>
      </div>
    </div>
  )
}
