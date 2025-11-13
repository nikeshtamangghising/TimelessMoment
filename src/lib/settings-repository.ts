import { db } from './db'
import { siteSettings } from './db/schema'
import { eq, asc } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { SettingType } from './db/schema'

type SiteSettings = InferSelectModel<typeof siteSettings>

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
    const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1)
    return result[0] || null
  }

  // Get a setting value by key with default fallback
  static async getValue(key: string, defaultValue: any = null): Promise<any> {
    let setting = await this.get(key)
    
    // If setting doesn't exist and we have a default, create it
    if (!setting && defaultValue !== null) {
      try {
        setting = await this.set(key, defaultValue, {
          description: `Auto-generated setting for ${key}`,
          category: 'auto',
          isPublic: true
        })
      } catch (error) {
        console.error(`Failed to create setting '${key}':`, error)
        return defaultValue
      }
    }
    
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
    
    let type: keyof typeof SettingType = SettingType.STRING
    if (typeof value === 'number') type = SettingType.NUMBER
    else if (typeof value === 'boolean') type = SettingType.BOOLEAN
    else if (typeof value === 'object') type = SettingType.JSON

    const existing = await this.get(key)
    
    if (existing) {
      const [updated] = await db.update(siteSettings)
        .set({
        value: stringValue,
        type: options.type || type,
        description: options.description,
        category: options.category,
        isPublic: options.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.key, key))
        .returning()
      return updated
    } else {
      const [created] = await db.insert(siteSettings)
        .values({
        key,
        value: stringValue,
        type: options.type || type,
        description: options.description || '',
        category: options.category || 'general',
        isPublic: options.isPublic || false,
        })
        .returning()
      return created
      }
  }

  // Get all settings by category
  static async getByCategory(category: string): Promise<SiteSettings[]> {
    return await db.select().from(siteSettings)
      .where(eq(siteSettings.category, category))
      .orderBy(asc(siteSettings.key))
  }

  // Get all public settings
  static async getPublicSettings(): Promise<Record<string, any>> {
    const settings = await db.select().from(siteSettings)
      .where(eq(siteSettings.isPublic, true))

    const result: Record<string, any> = {}
    for (const setting of settings) {
      result[setting.key] = await this.getValue(setting.key)
    }
    return result
  }

  // Delete a setting
  static async delete(key: string): Promise<boolean> {
    try {
      await db.delete(siteSettings).where(eq(siteSettings.key, key))
      return true
    } catch {
      return false
    }
  }

  // Get all settings
  static async getAll(): Promise<SiteSettings[]> {
    try {
      const settings = await db.select().from(siteSettings)
        .orderBy(asc(siteSettings.category), asc(siteSettings.key))
      return settings
    } catch (error) {
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
