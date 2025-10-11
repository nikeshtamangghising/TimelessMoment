'use client'

import { useState } from 'react'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface ShippingAddress {
  fullName: string
  email: string
  phone?: string
  address: string
  city: string
  postalCode: string
}

interface ShippingAddressFormProps {
  orderId: string
  initialAddress?: ShippingAddress | null
  onSave: (address: ShippingAddress) => void
  onCancel: () => void
}

export default function ShippingAddressForm({
  orderId,
  initialAddress,
  onSave,
  onCancel
}: ShippingAddressFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: initialAddress?.fullName || '',
    email: initialAddress?.email || '',
    phone: initialAddress?.phone || '',
    address: initialAddress?.address || '',
    city: initialAddress?.city || '',
    postalCode: initialAddress?.postalCode || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shippingAddress: formData }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update shipping address')
      }
      
      const result = await response.json()
      onSave(result.order.shippingAddress)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update shipping address'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium text-gray-900">
          Edit Shipping Address
        </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          
          <Input
            label="Phone (Optional)"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            error={errors.phone}
          />
          
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={errors.address}
            required
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
              required
            />
            
            <Input
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              error={errors.postalCode}
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Address'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}