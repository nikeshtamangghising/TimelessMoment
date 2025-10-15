import { NextRequest, NextResponse } from 'next/server'
import { SettingsRepository } from '@/lib/settings-repository'

// Get public settings (no authentication required)
export async function GET(request: NextRequest) {
  try {
    const settings = await SettingsRepository.getPublicSettings()
    
    return NextResponse.json({ 
      settings,
      cache: 'public, max-age=300' // Cache for 5 minutes
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
