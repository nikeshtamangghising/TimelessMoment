import { NextResponse } from 'next/server'
import { initializeDefaultSettings } from '@/lib/site-settings'

export async function POST() {
  try {
    await initializeDefaultSettings()
    return NextResponse.json({ success: true, message: 'Settings initialized successfully' })
  } catch (error) {
    console.error('Error initializing settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize settings' },
      { status: 500 }
    )
  }
}