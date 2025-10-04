import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SettingsRepository } from '@/lib/settings-repository'

// Initialize default settings (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize default settings
    await SettingsRepository.initializeDefaults()

    return NextResponse.json({ 
      success: true, 
      message: 'Default settings initialized successfully'
    })
  } catch (error) {
    console.error('Error initializing settings:', error)
    return NextResponse.json(
      { error: 'Failed to initialize settings' },
      { status: 500 }
    )
  }
}
