import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simple test without NextAuth
    return NextResponse.json({
      message: 'API route working',
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    })
  } catch (error) {
    console.error('API Test error:', error)
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    )
  }
}
