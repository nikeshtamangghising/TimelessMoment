'use client'

import { useState, useEffect } from 'react'
import { Address } from '@/types'
import Button from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RadioGroup } from '@/components/ui/radio-group'
import AddressForm from './address-form'

interface EnhancedAddressSelectorProps {
  type?: 'SHIPPING' | 'BILLING'
  selectedAddress?: Address | null
  onAddressSelect: (address: Address | null) => void
  onAddressSave?: (address: Address) => void
  showSaveOption?: boolean
}

export default function EnhancedAddressSelector({
  type = 'SHIPPING',
  selectedAddress,
  onAddressSelect,
  onAddressSave,
  showSaveOption = true
}: EnhancedAddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newAddressData, setNewAddressData] = useState<Partial<Address> | null>(null)
  const [saveNewAddress, setSaveNewAddress] = useState(true)

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
      // Simulate successful creation
      const newAddress: Address = {
        id: 'temp-' + Date.now(),
        ...addressData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setAddresses(prev => [...prev, newAddress])

      // Store in localStorage for persistence
      const stored = JSON.parse(localStorage.getItem('userAddresses') || '[]')
      stored.push(newAddress)
      localStorage.setItem('userAddresses', JSON.stringify(stored))

      if (onAddressSave) {
        onAddressSave(newAddress)
      }

      // Auto-select the newly created address and close the form
      onAddressSelect(newAddress)
      setShowForm(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create address')
    }
  }

  const handleUseNewAddress = async (addressData: any) => {
    if (saveNewAddress && onAddressSave) {
      await handleCreateAddress(addressData)
    } else {
      // Use address only for this order (temporary)
      const tempAddress = {
        id: 'temp-' + Date.now(), // Give it a temporary ID
        ...addressData,
        type,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Address
      onAddressSelect(tempAddress)
      setShowForm(false)
    }
  }

  const handleAddressSelect = (addressId: string) => {
    if (addressId === 'new') {
      setShowForm(true)
      setNewAddressData(null)
      return
    }

    const address = addresses.find(addr => addr.id === addressId)
    if (address) {
      onAddressSelect(address)
      // When selecting an existing address, hide the form
      setShowForm(false)
    }
  }

  const handleCancelNewAddress = () => {
    setShowForm(false)
    // If no address is selected, clear the selection
    if (!selectedAddress?.id) {
      onAddressSelect(null)
    }
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

  // Filter addresses by type
  const filteredAddresses = addresses.filter(addr => addr.type === type)

  return (
    <div className="space-y-4">
      {/* Address Selection Header */}
      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium text-gray-900">
          Select Shipping Address
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowForm(true)
            setNewAddressData(null)
          }}
        >
          Add New
        </Button>
      </div>

      {/* Show address selection only when not entering a new address */}
      {!showForm && (
        <div className="space-y-3">
          <RadioGroup
            value={selectedAddress?.id || ''}
            onValueChange={handleAddressSelect}
          >
            <div className="space-y-3">
              {/* Existing addresses */}
              {filteredAddresses.map((address) => (
                <Card
                  key={address.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedAddress?.id === address.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddress?.id === address.id}
                        onChange={() => {}} // Controlled by RadioGroup
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {address.fullName}
                          </span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 space-y-0.5">
                          <div>{address.address}</div>
                          <div>{address.city}, {address.postalCode}</div>
                          <div>{address.country}</div>
                          {address.phone && <div>Phone: {address.phone}</div>}
                          <div className="text-blue-600">{address.email}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* New address option */}
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  selectedAddress?.id === 'new' || showForm
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="address"
                      value="new"
                      checked={selectedAddress?.id === 'new' || showForm}
                      onChange={() => {}} // Controlled by RadioGroup
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        Add New Address
                      </div>
                      <div className="text-sm text-gray-600">
                        Enter a different shipping address
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </RadioGroup>
          
          {/* Display confirmation when address is selected */}
          {selectedAddress && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-green-700">
                  <p className="font-medium">Address selected!</p>
                  <p className="mt-1">Ready to proceed with payment.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show address form when needed */}
      {showForm && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">
              New Shipping Address
            </h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancelNewAddress}
            >
              Cancel
            </Button>
          </div>
          <AddressForm
            initialData={newAddressData || undefined}
            onSubmit={handleUseNewAddress}
            onCancel={handleCancelNewAddress}
            title=""
            submitLabel="Use This Address"
          />

          {showSaveOption && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveAddress"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="saveAddress" className="ml-2 block text-sm text-blue-700">
                  Save this address for future orders
                </label>
              </div>
              {!saveNewAddress && (
                <p className="mt-1 text-xs text-blue-600">
                  This address will only be used for this order.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-3">No saved addresses found.</p>
          <Button onClick={() => setShowForm(true)} size="sm" className="w-full">
            Add a shipping address
          </Button>
        </div>
      )}
    </div>
  )
}