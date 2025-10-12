import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Basic API working',
    timestamp: new Date().toISOString()
  })
}
