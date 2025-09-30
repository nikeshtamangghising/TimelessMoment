import { NextRequest, NextResponse } from 'next/server'
import { HealthChecker } from '@/lib/monitoring'

// Readiness probe - checks if the application is ready to serve traffic
export async function GET(request: NextRequest) {
  try {
    // Check critical dependencies
    const dbCheck = await HealthChecker.checkDatabase()
    
    if (dbCheck.status === 'unhealthy') {
      return NextResponse.json(
        {
          ready: false,
          reason: 'Database unavailable',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    // Check if environment variables are set
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'STRIPE_SECRET_KEY',
    ]

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          ready: false,
          reason: `Missing environment variables: ${missingEnvVars.join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        ready: true,
        timestamp: new Date().toISOString(),
        database: dbCheck.status,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}