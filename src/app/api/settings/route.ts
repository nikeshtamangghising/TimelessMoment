import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings, updateSiteSetting } from '@/lib/site-settings'

export async function GET() {
  try {
    const settings = await getSiteSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { key, value, type = 'STRING' } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      )
    }

    await updateSiteSetting(key, value, type)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Setting updated successfully' 
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}