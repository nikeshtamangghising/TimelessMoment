import { NextRequest } from 'next/server'

// Types for monitoring
interface ErrorContext {
  userId?: string
  requestId?: string
  url?: string
  method?: string
  userAgent?: string
  ip?: string
  timestamp?: Date
}

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  tags?: Record<string, string>
  timestamp?: Date
}

interface BusinessMetric {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

// Error tracking
export class ErrorTracker {
  private static instance: ErrorTracker
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && !!process.env.SENTRY_DSN
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  captureError(error: Error, context?: ErrorContext): void {
    if (!this.isEnabled) {
      return
    }

    try {
      // In production, this would integrate with Sentry or similar
      this.sendToErrorService({
        message: error.message,
        stack: error.stack,
        name: error.name,
        context,
        timestamp: new Date(),
      })
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError)
    }
  }

  captureException(exception: any, context?: ErrorContext): void {
    const error = exception instanceof Error ? exception : new Error(String(exception))
    this.captureError(error, context)
  }

  private async sendToErrorService(errorData: any): Promise<void> {
    // Implementation would depend on your error tracking service
    // Example: Sentry, Bugsnag, LogRocket, etc.
    
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
    }

    // Also log to application logs
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && process.env.ENABLE_MONITORING === 'true'
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return

    const metricWithTimestamp = {
      ...metric,
      timestamp: metric.timestamp || new Date(),
    }

    this.metrics.push(metricWithTimestamp)

    // Send to monitoring service
    this.sendMetric(metricWithTimestamp)

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  recordApiLatency(endpoint: string, duration: number, statusCode: number): void {
    this.recordMetric({
      name: 'api_latency',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint,
        status_code: statusCode.toString(),
      },
    })
  }

  recordDatabaseQuery(query: string, duration: number): void {
    this.recordMetric({
      name: 'database_query_duration',
      value: duration,
      unit: 'ms',
      tags: {
        query_type: query.split(' ')[0].toLowerCase(),
      },
    })
  }

  recordPageLoad(page: string, duration: number): void {
    this.recordMetric({
      name: 'page_load_time',
      value: duration,
      unit: 'ms',
      tags: {
        page,
      },
    })
  }

  private async sendMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Send to monitoring service (e.g., DataDog, New Relic, etc.)
      if (process.env.MONITORING_ENDPOINT) {
        await fetch(process.env.MONITORING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`,
          },
          body: JSON.stringify(metric),
        })
      }
    } catch (error) {
      console.error('Failed to send metric:', error)
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }
}

// Business metrics tracking
export class BusinessMetrics {
  private static instance: BusinessMetrics
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && process.env.ENABLE_ANALYTICS === 'true'
  }

  static getInstance(): BusinessMetrics {
    if (!BusinessMetrics.instance) {
      BusinessMetrics.instance = new BusinessMetrics()
    }
    return BusinessMetrics.instance
  }

  track(event: string, properties?: Record<string, any>, userId?: string): void {
    if (!this.isEnabled) return

    const metric: BusinessMetric = {
      event,
      properties,
      userId,
      timestamp: new Date(),
    }

    this.sendBusinessMetric(metric)
  }

  trackPurchase(orderId: string, amount: number, currency: string, userId?: string): void {
    this.track('purchase_completed', {
      order_id: orderId,
      amount,
      currency,
    }, userId)
  }

  trackProductView(productId: string, productName: string, userId?: string): void {
    this.track('product_viewed', {
      product_id: productId,
      product_name: productName,
    }, userId)
  }

  trackCartAction(action: 'add' | 'remove' | 'update', productId: string, quantity: number, userId?: string): void {
    this.track('cart_action', {
      action,
      product_id: productId,
      quantity,
    }, userId)
  }

  trackUserSignup(userId: string, method: string): void {
    this.track('user_signup', {
      signup_method: method,
    }, userId)
  }

  private async sendBusinessMetric(metric: BusinessMetric): Promise<void> {
    try {
      // Send to analytics service (e.g., Mixpanel, Amplitude, Google Analytics)
      if (process.env.ANALYTICS_ENDPOINT) {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
          },
          body: JSON.stringify(metric),
        })
      }
    } catch (error) {
      console.error('Failed to send business metric:', error)
    }
  }
}

// Request context middleware
export function createRequestContext(request: NextRequest): ErrorContext {
  return {
    requestId: crypto.randomUUID(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    timestamp: new Date(),
  }
}

// Performance timing utilities
export class Timer {
  private startTime: number

  constructor() {
    this.startTime = performance.now()
  }

  stop(): number {
    return performance.now() - this.startTime
  }

  stopAndRecord(metricName: string, tags?: Record<string, string>): void {
    const duration = this.stop()
    PerformanceMonitor.getInstance().recordMetric({
      name: metricName,
      value: duration,
      unit: 'ms',
      tags,
    })
  }
}

// Health check utilities
export interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  latency?: number
  error?: string
  timestamp: Date
}

export class HealthChecker {
  static async checkDatabase(): Promise<HealthCheck> {
    const timer = new Timer()
    
    try {
      // This would check database connectivity
      // const result = await prisma.$queryRaw`SELECT 1`
      
      return {
        service: 'database',
        status: 'healthy',
        latency: timer.stop(),
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: timer.stop(),
        timestamp: new Date(),
      }
    }
  }

  static async checkExternalServices(): Promise<HealthCheck[]> {
    const checks: Promise<HealthCheck>[] = []

    // Check Stripe
    checks.push(this.checkStripe())
    
    // Check Email Service
    checks.push(this.checkEmailService())

    return Promise.all(checks)
  }

  private static async checkStripe(): Promise<HealthCheck> {
    const timer = new Timer()
    
    try {
      // This would ping Stripe API
      const response = await fetch('https://api.stripe.com/v1/charges?limit=1', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        },
      })

      return {
        service: 'stripe',
        status: response.ok ? 'healthy' : 'degraded',
        latency: timer.stop(),
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'stripe',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: timer.stop(),
        timestamp: new Date(),
      }
    }
  }

  private static async checkEmailService(): Promise<HealthCheck> {
    const timer = new Timer()
    
    try {
      // This would check email service status
      return {
        service: 'email',
        status: 'healthy',
        latency: timer.stop(),
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        service: 'email',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: timer.stop(),
        timestamp: new Date(),
      }
    }
  }
}

// Export singleton instances
export const errorTracker = ErrorTracker.getInstance()
export const performanceMonitor = PerformanceMonitor.getInstance()
export const businessMetrics = BusinessMetrics.getInstance()