import { NextRequest, NextResponse } from 'next/server'
import { HealthChecker, type HealthCheck } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    const checks: HealthCheck[] = []

    // Check database
    const dbCheck = await HealthChecker.checkDatabase()
    checks.push(dbCheck)

    // Check external services
    const externalChecks = await HealthChecker.checkExternalServices()
    checks.push(...externalChecks)

    // Determine overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy')
    const hasDegraded = checks.some(check => check.status === 'degraded')
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (hasUnhealthy) {
      overallStatus = 'unhealthy'
    } else if (hasDegraded) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: checks.reduce((acc, check) => {
        acc[check.service] = {
          status: check.status,
          latency: check.latency,
          error: check.error,
          timestamp: check.timestamp.toISOString(),
        }
        return acc
      }, {} as Record<string, any>),
    }

    // Return appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

// Simple liveness probe
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}