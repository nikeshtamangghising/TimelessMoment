'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'

interface SiteSettingsData {
  shipping: {
    freeShippingThreshold: number
    currency: string
    shippingCost: number
    expressShippingCost?: number
  }
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

export default function SettingsManager() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage('Error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any, type: 'STRING' | 'NUMBER' | 'BOOLEAN' = 'STRING') => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value, type }),
      })

      const data = await response.json()
      if (data.success) {
        setMessage('Setting updated successfully')
        await fetchSettings() // Refresh settings
      } else {
        setMessage(data.error || 'Error updating setting')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      setMessage('Error updating setting')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: string, value: any, type: 'STRING' | 'NUMBER' | 'BOOLEAN' = 'STRING') => {
    if (!settings) return

    const keys = key.split('.')
    const newSettings = { ...settings }
    let current: any = newSettings

    // Navigate to the nested property
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }

    // Set the value
    const lastKey = keys[keys.length - 1]
    current[lastKey] = type === 'NUMBER' ? Number(value) : type === 'BOOLEAN' ? Boolean(value) : value

    setSettings(newSettings)
  }

  if (loading) {
    return <div className="p-6">Loading settings...</div>
  }

  if (!settings) {
    return <div className="p-6">Error loading settings</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        {message && (
          <div className={`px-4 py-2 rounded-md text-sm ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Shipping Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Free Shipping Threshold
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.shipping.freeShippingThreshold}
                  onChange={(e) => handleInputChange('shipping.freeShippingThreshold', e.target.value, 'NUMBER')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  onClick={() => updateSetting('shipping.freeShippingThreshold', settings.shipping.freeShippingThreshold, 'NUMBER')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Currency
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={settings.shipping.currency}
                  onChange={(e) => handleInputChange('shipping.currency', e.target.value, 'STRING')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="NPR">NPR - Nepalese Rupee</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
                <Button
                  onClick={() => updateSetting('shipping.currency', settings.shipping.currency, 'STRING')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Shipping Cost
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={settings.shipping.shippingCost}
                  onChange={(e) => handleInputChange('shipping.shippingCost', e.target.value, 'NUMBER')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  onClick={() => updateSetting('shipping.shippingCost', settings.shipping.shippingCost, 'NUMBER')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Express Shipping Cost
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={settings.shipping.expressShippingCost || 0}
                  onChange={(e) => handleInputChange('shipping.expressShippingCost', e.target.value, 'NUMBER')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  onClick={() => updateSetting('shipping.expressShippingCost', settings.shipping.expressShippingCost, 'NUMBER')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Currency Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={settings.currency.default}
                  onChange={(e) => handleInputChange('currency.default', e.target.value, 'STRING')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD</option>
                  <option value="NPR">NPR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <Button
                  onClick={() => updateSetting('currency.default', settings.currency.default, 'STRING')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Symbol
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={settings.currency.symbol}
                  onChange={(e) => handleInputChange('currency.symbol', e.target.value, 'STRING')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  onClick={() => updateSetting('currency.symbol', settings.currency.symbol, 'STRING')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol Position
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={settings.currency.position}
                  onChange={(e) => handleInputChange('currency.position', e.target.value, 'STRING')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="before">Before ($100)</option>
                  <option value="after">After (100$)</option>
                </select>
                <Button
                  onClick={() => updateSetting('currency.position', settings.currency.position, 'STRING')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Policy Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Period (Days)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.policies.returnDays}
                  onChange={(e) => handleInputChange('policies.returnDays', e.target.value, 'NUMBER')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  onClick={() => updateSetting('policies.returnDays', settings.policies.returnDays, 'NUMBER')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warranty Period (Days)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={settings.policies.warrantyDays}
                  onChange={(e) => handleInputChange('policies.warrantyDays', e.target.value, 'NUMBER')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  onClick={() => updateSetting('policies.warrantyDays', settings.policies.warrantyDays, 'NUMBER')}
                  disabled={saving}
                  size="sm"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Changes take effect immediately on the website</li>
          <li>• The free shipping threshold will be displayed in trust badges</li>
          <li>• Currency settings affect all price displays</li>
          <li>• Return and warranty periods are shown in product information</li>
        </ul>
      </div>
    </div>
  )
}