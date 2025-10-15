import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SettingsRepository } from '@/lib/settings-repository'
import { z } from 'zod'

// Validation schemas
const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().optional(),
})

const updateMultipleSettingsSchema = z.array(updateSettingSchema)

// Get all settings (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let settings
    if (category) {
      settings = await SettingsRepository.getByCategory(category)
    } else {
      settings = await SettingsRepository.getAll()
    }

    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// Update settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Check if it's a single setting or multiple settings
    if (Array.isArray(body)) {
      // Multiple settings update
      const validatedData = updateMultipleSettingsSchema.parse(body)
      
      const updatedSettings = []
      for (const setting of validatedData) {
        const updated = await SettingsRepository.set(
          setting.key,
          setting.value,
          {
            description: setting.description,
            category: setting.category,
            isPublic: setting.isPublic,
          }
        )
        updatedSettings.push(updated)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${updatedSettings.length} settings updated successfully`,
        settings: updatedSettings
      })
    } else {
      // Single setting update
      const validatedData = updateSettingSchema.parse(body)
      
      const updatedSetting = await SettingsRepository.set(
        validatedData.key,
        validatedData.value,
        {
          description: validatedData.description,
          category: validatedData.category,
          isPublic: validatedData.isPublic,
        }
      )
      
      return NextResponse.json({ 
        success: true, 
        message: 'Setting updated successfully',
        setting: updatedSetting
      })
    }
  } catch (error) {
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// Delete setting (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    const deleted = await SettingsRepository.delete(key)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Setting deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    )
  }
}
