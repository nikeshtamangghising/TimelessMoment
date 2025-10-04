import { SiteSettings, SettingType } from '@prisma/client'
import { prisma } from './db'

export interface SettingInput {
  key: string
  value: string
  type?: SettingType
  description?: string
  category?: string
  isPublic?: boolean
}

export class SettingsRepository {
  // Get a setting by key
  static async get(key: string): Promise<SiteSettings | null> {
    return await prisma.siteSettings.findUnique({
      where: { key }
    })
  }

  // Get a setting value by key with default fallback
  static async getValue(key: string, defaultValue: any = null): Promise<any> {
    const setting = await this.get(key)
    if (!setting) return defaultValue

    switch (setting.type) {
      case 'NUMBER':
        return parseFloat(setting.value)
      case 'BOOLEAN':
        return setting.value === 'true'
      case 'JSON':
        try {
          return JSON.parse(setting.value)
        } catch {
          return defaultValue
        }
      default:
        return setting.value
    }
  }

  // Set a setting value
  static async set(key: string, value: any, options: Partial<SettingInput> = {}): Promise<SiteSettings> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value.toString()
    
    let type: SettingType = 'STRING'
    if (typeof value === 'number') type = 'NUMBER'
    else if (typeof value === 'boolean') type = 'BOOLEAN'
    else if (typeof value === 'object') type = 'JSON'

    return await prisma.siteSettings.upsert({
      where: { key },
      update: {
        value: stringValue,
        type: options.type || type,
        description: options.description,
        category: options.category,
        isPublic: options.isPublic,
      },
      create: {
        key,
        value: stringValue,
        type: options.type || type,
        description: options.description || '',
        category: options.category || 'general',
        isPublic: options.isPublic || false,
      }
    })
  }

  // Get all settings by category
  static async getByCategory(category: string): Promise<SiteSettings[]> {
    return await prisma.siteSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    })
  }

  // Get all public settings
  static async getPublicSettings(): Promise<Record<string, any>> {
    const settings = await prisma.siteSettings.findMany({
      where: { isPublic: true }
    })

    const result: Record<string, any> = {}
    for (const setting of settings) {
      result[setting.key] = await this.getValue(setting.key)
    }
    return result
  }

  // Delete a setting
  static async delete(key: string): Promise<boolean> {
    try {
      await prisma.siteSettings.delete({
        where: { key }
      })
      return true
    } catch {
      return false
    }
  }

  // Get all settings
  static async getAll(): Promise<SiteSettings[]> {
    try {
      console.log('Fetching all settings from database...')
      const settings = await prisma.siteSettings.findMany({
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      })
      console.log(`Found ${settings.length} settings`)
      return settings
    } catch (error) {
      console.error('Error in SettingsRepository.getAll:', error)
      throw error
    }
  }

  // Initialize default settings
  static async initializeDefaults(): Promise<void> {
    const defaults = [
      // Shipping settings
      {
        key: 'shipping_rate',
        value: '999',
        type: 'NUMBER' as SettingType,
        description: 'Default shipping rate in NPR',
        category: 'shipping',
        isPublic: true
      },
      {
        key: 'free_shipping_threshold',
        value: '7500',
        type: 'NUMBER' as SettingType,
        description: 'Minimum order amount for free shipping in NPR',
        category: 'shipping',
        isPublic: true
      },
      {
        key: 'express_shipping_rate',
        value: '1999',
        type: 'NUMBER' as SettingType,
        description: 'Express shipping rate in NPR',
        category: 'shipping',
        isPublic: true
      },
      
      // Tax settings
      {
        key: 'tax_rate',
        value: '0.13',
        type: 'NUMBER' as SettingType,
        description: 'Tax rate as decimal (13% VAT = 0.13)',
        category: 'tax',
        isPublic: true
      },
      {
        key: 'tax_name',
        value: 'VAT',
        type: 'STRING' as SettingType,
        description: 'Display name for tax',
        category: 'tax',
        isPublic: true
      },
      
      // Currency settings
      {
        key: 'default_currency',
        value: 'NPR',
        type: 'STRING' as SettingType,
        description: 'Default currency code',
        category: 'currency',
        isPublic: true
      },
      
      // Store settings
      {
        key: 'store_name',
        value: 'Timeless Store',
        type: 'STRING' as SettingType,
        description: 'Store name',
        category: 'store',
        isPublic: true
      },
      {
        key: 'store_address',
        value: 'Kathmandu, Nepal',
        type: 'STRING' as SettingType,
        description: 'Store address',
        category: 'store',
        isPublic: true
      }
    ]

    for (const setting of defaults) {
      await this.set(setting.key, setting.value, {
        type: setting.type,
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic
      })
    }
  }
}

// Export static methods directly
export { SettingsRepository as settingsRepository }
