'use client'

import { useState, useEffect } from 'react'
import { 
  CogIcon, 
  CurrencyDollarIcon, 
  TruckIcon, 
  CalculatorIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { useSession } from 'next-auth/react'

interface Setting {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'PASSWORD'
  description?: string
  category: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

interface SettingsByCategory {
  [category: string]: Setting[]
}

export default function AdminSettingsTab() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<SettingsByCategory>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const initializeSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      })

      if (response.ok) {
        setError('')
        setMessage('Default settings initialized! Reloading...')
        setTimeout(() => {
          fetchSettings()
        }, 1000)
      } else {
        setError('Failed to initialize default settings')
      }
    } catch (err) {
      setError('Failed to initialize default settings')
      console.error('Settings initialization error:', err)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.status === 401) {
        setError('Unauthorized. Please ensure you are logged in as an admin.')
        return
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.settings || data.settings.length === 0) {
        await initializeSettings()
        return
      }
      
      // Group settings by category
      const grouped: SettingsByCategory = {}
      data.settings.forEach((setting: Setting) => {
        if (!grouped[setting.category]) {
          grouped[setting.category] = []
        }
        grouped[setting.category].push(setting)
      })
      
      setSettings(grouped)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings'
      setError(errorMessage)
      console.error('Settings fetch error:', err)
    } finally {
      setLoading(false)
    }
  }


  const handleValueChange = (category: string, settingIndex: number, newValue: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category].map((setting, index) => 
        index === settingIndex 
          ? { ...setting, value: newValue }
          : setting
      )
    }))
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      // Flatten settings for API
      const allSettings = Object.values(settings).flat().map(setting => ({
        key: setting.key,
        value: setting.type === 'NUMBER' ? parseFloat(setting.value) : 
               setting.type === 'BOOLEAN' ? setting.value === 'true' : 
               setting.value,
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic
      }))

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        body: JSON.stringify(allSettings)
      })

      if (response.status === 401) {
        setError('Unauthorized. Please ensure you are logged in as an admin.')
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings'
      setError(errorMessage)
      console.error('Settings save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shipping':
        return <TruckIcon className="h-5 w-5" />
      case 'tax':
        return <CalculatorIcon className="h-5 w-5" />
      case 'currency':
        return <CurrencyDollarIcon className="h-5 w-5" />
      case 'store':
        return <BuildingStorefrontIcon className="h-5 w-5" />
      default:
        return <CogIcon className="h-5 w-5" />
    }
  }

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'shipping':
        return 'Shipping Settings'
      case 'tax':
        return 'Tax Settings'
      case 'currency':
        return 'Currency Settings'
      case 'store':
        return 'Store Settings'
      default:
        return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your store settings and preferences
          </p>
        </div>
        
        <Button 
          onClick={saveSettings}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <Button 
              onClick={fetchSettings}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* No Settings Fallback */}
      {Object.keys(settings).length === 0 && !loading && (
        <div className="text-center py-12">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Settings Found</h3>
          <p className="text-gray-500 mb-6">
            It looks like the default settings haven't been initialized yet.
          </p>
          <Button 
            onClick={initializeSettings}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Initialize Default Settings
          </Button>
        </div>
      )}

      {/* Settings by Category */}
      <div className="grid gap-6">
        {Object.entries(settings).map(([category, categorySettings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getCategoryIcon(category)}
                <span>{getCategoryTitle(category)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {categorySettings.map((setting, index) => (
                  <div key={setting.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {setting.description || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    
                    {setting.type === 'BOOLEAN' ? (
                      <select
                        value={setting.value}
                        onChange={(e) => handleValueChange(category, index, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : setting.type === 'PASSWORD' ? (
                      <div className="relative">
                        <input
                          type={showPasswords[setting.key] ? 'text' : 'password'}
                          value={setting.value}
                          onChange={(e) => handleValueChange(category, index, e.target.value)}
                          className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility(setting.key)}
                        >
                          {showPasswords[setting.key] ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type={setting.type === 'NUMBER' ? 'number' : 'text'}
                          value={setting.value}
                          onChange={(e) => handleValueChange(category, index, e.target.value)}
                          step={setting.key.includes('rate') ? '0.01' : '1'}
                          min={setting.type === 'NUMBER' ? '0' : undefined}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        
                        {/* Currency/Unit indicators */}
                        {setting.key.includes('threshold') || setting.key.includes('shipping_rate') ? (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                            NPR
                          </div>
                        ) : setting.key.includes('tax_rate') ? (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                            %
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Key: {setting.key}</span>
                      <span className={`px-2 py-1 rounded ${setting.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {setting.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <strong>Shipping Settings:</strong>
              <ul className="ml-4 mt-1 list-disc">
                <li><strong>Shipping Rate:</strong> Standard shipping cost in NPR (e.g., 999)</li>
                <li><strong>Free Shipping Threshold:</strong> Minimum order amount for free shipping (e.g., 7500)</li>
                <li><strong>Express Shipping Rate:</strong> Faster delivery option cost (e.g., 1999)</li>
              </ul>
            </div>
            
            <div>
              <strong>Tax Settings:</strong>
              <ul className="ml-4 mt-1 list-disc">
                <li><strong>Tax Rate:</strong> Percentage rate (e.g., 13% for VAT)</li>
                <li><strong>Tax Name:</strong> Display name (e.g., "VAT", "Sales Tax")</li>
              </ul>
            </div>
            
            <div>
              <strong>Currency Settings:</strong>
              <ul className="ml-4 mt-1 list-disc">
                <li><strong>Default Currency:</strong> Primary currency code (NPR, USD, etc.)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
