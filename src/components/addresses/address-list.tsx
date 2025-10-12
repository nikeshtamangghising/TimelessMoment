'use client'

import { useState, useEffect } from 'react'
import { Address } from '@/types'
import Button from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import AddressForm from './address-form'

interface AddressListProps {
  selectedAddressId?: string
  onAddressSelect?: (address: Address) => void
  type?: 'SHIPPING' | 'BILLING'
  showCreateNew?: boolean
  onCreateNew?: () => void
}

export default function AddressList({
  selectedAddressId,
  onAddressSelect,
  type = 'SHIPPING',
  showCreateNew = true,
  onCreateNew
}: AddressListProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

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

  const handleCreateAddress = async (addressData: any) => {
    try {
      // For now, simulate address creation since API routes have issues
      // In a working setup, this would be:
      // const response = await fetch('/api/addresses', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(addressData),
      // })
      // if (response.ok) {
      //   setShowForm(false)
      //   fetchAddresses()
      // } else {
      //   const errorData = await response.json()
      //   throw new Error(errorData.error || 'Failed to create address')
      // }

      // Simulate successful creation
      const newAddress: Address = {
        id: 'temp-' + Date.now(),
        ...addressData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setAddresses(prev => [...prev, newAddress])
      setShowForm(false)

      // Store in localStorage for persistence (temporary solution)
      const stored = JSON.parse(localStorage.getItem('userAddresses') || '[]')
      stored.push(newAddress)
      localStorage.setItem('userAddresses', JSON.stringify(stored))

    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create address')
    }
  }

  const handleUpdateAddress = async (addressData: any) => {
    if (!editingAddress) return

    try {
      // Simulate successful update
      const updatedAddress = {
        ...editingAddress,
        ...addressData,
        updatedAt: new Date(),
      }

      setAddresses(prev => prev.map(addr =>
        addr.id === editingAddress.id ? updatedAddress : addr
      ))
      setEditingAddress(null)

      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('userAddresses') || '[]')
      const index = stored.findIndex((addr: Address) => addr.id === editingAddress.id)
      if (index !== -1) {
        stored[index] = updatedAddress
        localStorage.setItem('userAddresses', JSON.stringify(stored))
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update address')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      setAddresses(prev => prev.filter(addr => addr.id !== addressId))

      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('userAddresses') || '[]')
      const filtered = stored.filter((addr: Address) => addr.id !== addressId)
      localStorage.setItem('userAddresses', JSON.stringify(filtered))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete address')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })))

      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('userAddresses') || '[]')
      const updated = stored.map((addr: Address) => ({
        ...addr,
        isDefault: addr.id === addressId
      }))
      localStorage.setItem('userAddresses', JSON.stringify(updated))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to set default address')
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
  }

  const handleCancelEdit = () => {
    setEditingAddress(null)
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

  // Filter addresses by type if specified
  const filteredAddresses = type ? addresses.filter(addr => addr.type === type) : addresses

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {type === 'SHIPPING' ? 'Shipping Addresses' : 'Billing Addresses'}
        </h3>
        {showCreateNew && (
          <Button onClick={() => onCreateNew ? onCreateNew() : setShowForm(true)}>
            Add New Address
          </Button>
        )}
      </div>

      {showForm && (
        <AddressForm
          onSubmit={handleCreateAddress}
          onCancel={() => setShowForm(false)}
          title={`Add ${type === 'SHIPPING' ? 'Shipping' : 'Billing'} Address`}
          submitLabel="Add Address"
        />
      )}

      {editingAddress && (
        <AddressForm
          initialData={editingAddress}
          onSubmit={handleUpdateAddress}
          onCancel={handleCancelEdit}
          title="Edit Address"
          submitLabel="Update Address"
        />
      )}

      {filteredAddresses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {type === 'SHIPPING' ? 'shipping' : 'billing'} addresses found.
          <br />
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => setShowForm(true)}
          >
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAddresses.map((address) => (
            <Card
              key={address.id}
              className={`cursor-pointer transition-colors ${
                selectedAddressId === address.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div
                    className="flex-1"
                    onClick={() => onAddressSelect?.(address)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {address.fullName}
                      </span>
                      {address.isDefault && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Default
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        address.type === 'SHIPPING'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {address.type}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{address.address}</div>
                      <div>{address.city}, {address.postalCode}</div>
                      <div>{address.country}</div>
                      {address.phone && <div>Phone: {address.phone}</div>}
                      <div className="text-blue-600">{address.email}</div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetDefault(address.id)
                        }}
                      >
                        Set Default
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(address)
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAddress(address.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
