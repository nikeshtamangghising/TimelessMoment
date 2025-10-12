import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('API Test - Session:', session)

    if (!session?.user) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    return NextResponse.json({
      message: 'Session found',
      user: session.user,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API Test error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
}
