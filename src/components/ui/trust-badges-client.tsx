'use client'

import React, { useState, useEffect } from 'react'
import { TruckIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/currency'

interface ShippingSettings {
  freeShippingThreshold: number
  currency: string
  shippingCost: number
  expressShippingCost?: number
}

interface SiteSettingsData {
  shipping: ShippingSettings
  tax: {
    rate: number
    included: boolean
  }
  currency: {
    default: string
    symbol: string
    position: 'before' | 'after'
  }
  policies: {
    returnDays: number
    warrantyDays: number
  }
}

interface TrustBadgesClientProps {
  className?: string
}

export default function TrustBadgesClient({ className = '' }: TrustBadgesClientProps) {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.success) {
          setSettings(data.data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        // Fallback to default settings
        setSettings({
          shipping: {
            freeShippingThreshold: 50,
            currency: 'USD',
            shippingCost: 5.99,
          },
          tax: {
            rate: 0.1,
            included: false,
          },
          currency: {
            default: 'USD',
            symbol: '$',
            position: 'before',
          },
          policies: {
            returnDays: 30,
            warrantyDays: 365,
          },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return null
  }

  const { shipping, policies } = settings

  const badges = [
    {
      icon: TruckIcon,
      title: 'Free Shipping',
      description: `On orders over ${formatCurrency(shipping.freeShippingThreshold, shipping.currency)}`,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Payment',
      description: 'SSL encrypted',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: ArrowPathIcon,
      title: `${policies.returnDays}-Day Returns`,
      description: 'Hassle-free returns',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ]

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Buy From Us?</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {badges.map((badge, index) => {
          const IconComponent = badge.icon
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`p-2 ${badge.bgColor} rounded-full`}>
                <IconComponent className={`w-6 h-6 ${badge.iconColor}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{badge.title}</div>
                <div className="text-xs text-gray-500">{badge.description}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}