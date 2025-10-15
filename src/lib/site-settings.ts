import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ShippingSettings {
  freeShippingThreshold: number
  currency: string
  shippingCost: number
  expressShippingCost?: number
}

export interface SiteSettingsData {
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

// Default settings fallback
const DEFAULT_SETTINGS: SiteSettingsData = {
  shipping: {
    freeShippingThreshold: 999,
    currency: 'NPR',
    shippingCost: 199,
    expressShippingCost: 499,
  },
  tax: {
    rate: 0.1,
    included: false,
  },
  currency: {
    default: 'NPR',
    symbol: 'Rs.',
    position: 'before',
  },
  policies: {
    returnDays: 30,
    warrantyDays: 365,
  },
}

// Cache for settings
let settingsCache: SiteSettingsData | null = null
let cacheExpiry: Date | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getSiteSettings(): Promise<SiteSettingsData> {
  // Check cache first
  if (settingsCache && cacheExpiry && new Date() < cacheExpiry) {
    return settingsCache
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        isPublic: true,
      },
    })

    // Build settings object from database
    const siteSettings: SiteSettingsData = { ...DEFAULT_SETTINGS }

    for (const setting of settings) {
      const keys = setting.key.split('.')
      let current: any = siteSettings

      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      // Set the value based on type
      const lastKey = keys[keys.length - 1]
      switch (setting.type) {
        case 'NUMBER':
          current[lastKey] = parseFloat(setting.value)
          break
        case 'BOOLEAN':
          current[lastKey] = setting.value === 'true'
          break
        case 'JSON':
          try {
            current[lastKey] = JSON.parse(setting.value)
          } catch {
            current[lastKey] = setting.value
          }
          break
        default:
          current[lastKey] = setting.value
      }
    }

    // Cache the results
    settingsCache = siteSettings
    cacheExpiry = new Date(Date.now() + CACHE_DURATION)

    return siteSettings
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return DEFAULT_SETTINGS
  }
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const settings = await getSiteSettings()
  return settings.shipping
}

export async function updateSiteSetting(key: string, value: any, type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING') {
  try {
    const stringValue = type === 'JSON' ? JSON.stringify(value) : String(value)
    
    await prisma.siteSettings.upsert({
      where: { key },
      update: {
        value: stringValue,
        type,
        updatedAt: new Date(),
      },
      create: {
        key,
        value: stringValue,
        type,
        isPublic: true,
        category: key.includes('shipping') ? 'shipping' : 'general',
      },
    })

    // Clear cache
    settingsCache = null
    cacheExpiry = null
  } catch (error) {
    console.error('Error updating site setting:', error)
    throw error
  }
}

// Initialize default settings if they don't exist
export async function initializeDefaultSettings() {
  try {
    const existingSettings = await prisma.siteSettings.count()
    
    if (existingSettings === 0) {
      const settingsToCreate = [
        // Shipping settings
        { key: 'shipping.freeShippingThreshold', value: '999', type: 'NUMBER' as const, category: 'shipping' },
        { key: 'shipping.currency', value: 'NPR', type: 'STRING' as const, category: 'shipping' },
        { key: 'shipping.shippingCost', value: '199', type: 'NUMBER' as const, category: 'shipping' },
        { key: 'shipping.expressShippingCost', value: '499', type: 'NUMBER' as const, category: 'shipping' },
        
        // Currency settings
        { key: 'currency.default', value: 'NPR', type: 'STRING' as const, category: 'currency' },
        { key: 'currency.symbol', value: 'Rs.', type: 'STRING' as const, category: 'currency' },
        { key: 'currency.position', value: 'before', type: 'STRING' as const, category: 'currency' },
        
        // Tax settings
        { key: 'tax.rate', value: '0.1', type: 'NUMBER' as const, category: 'tax' },
        { key: 'tax.included', value: 'false', type: 'BOOLEAN' as const, category: 'tax' },
        
        // Policy settings
        { key: 'policies.returnDays', value: '30', type: 'NUMBER' as const, category: 'policies' },
        { key: 'policies.warrantyDays', value: '365', type: 'NUMBER' as const, category: 'policies' },
      ]

      for (const setting of settingsToCreate) {
        await prisma.siteSettings.create({
          data: {
            ...setting,
            isPublic: true,
            description: `Default ${setting.key.replace('.', ' ')} setting`,
          },
        })
      }
    }
  } catch (error) {
    console.error('Error initializing default settings:', error)
  }
}