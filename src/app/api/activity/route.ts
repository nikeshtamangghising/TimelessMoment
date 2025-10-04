import { NextRequest, NextResponse } from 'next/server'
import { ActivityTracker, ActivityData } from '@/lib/activity-tracker'

export async function POST(request: NextRequest) {
  try {
    const data: ActivityData = await request.json()
    
    // Validate required fields
    if (!data.productId || !data.activityType) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, activityType' },
        { status: 400 }
      )
    }
    
    // Ensure we have either userId or sessionId
    if (!data.userId && !data.sessionId) {
      return NextResponse.json(
        { error: 'Either userId or sessionId is required' },
        { status: 400 }
      )
    }
    
    // Track the activity using the server-side ActivityTracker
    const result = await ActivityTracker.trackActivity(data)
    
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error tracking activity:', error)
    return NextResponse.json(
      { error: 'Failed to track activity' },
      { status: 500 }
    )
  }
}