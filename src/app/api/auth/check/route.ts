import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      } : null,
      sessionExists: !!session
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({
      error: 'Failed to check authentication',
      authenticated: false,
      user: null
    }, { status: 500 })
  }
}
