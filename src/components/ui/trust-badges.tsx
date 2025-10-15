import React from 'react'
import { TruckIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/currency'
import { getSiteSettings } from '@/lib/site-settings'

interface TrustBadgesProps {
  className?: string
}

export default async function TrustBadges({ className = '' }: TrustBadgesProps) {
  const settings = await getSiteSettings()
  const { shipping, currency, policies } = settings

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