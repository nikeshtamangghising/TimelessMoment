// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

export interface WebVitals {
  CLS?: number
  FID?: number
  FCP?: number
  LCP?: number
  TTFB?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private observers: PerformanceObserver[] = []

  // Start performance measurement
  startMeasurement(name: string, metadata?: Record<string, any>): string {
    const startTime = performance.now()
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    this.metrics.push({
      name: id,
      startTime,
      metadata,
    })

    // Use Performance API if available
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${id}-start`)
    }

    return id
  }

  // End performance measurement
  endMeasurement(id: string): PerformanceMetrics | null {
    const metric = this.metrics.find(m => m.name === id)
    if (!metric) return null

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    // Use Performance API if available
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${id}-end`)
      performance.measure(id, `${id}-start`, `${id}-end`)
    }

    // Log slow operations
    if (duration > 1000) { // More than 1 second
      console.warn(`Slow operation detected: ${id} took ${duration.toFixed(2)}ms`)
    }

    return metric
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  // Get metrics by name pattern
  getMetricsByName(pattern: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.name.includes(pattern))
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = []
  }

  // Initialize Web Vitals monitoring
  initWebVitals(): void {
    if (typeof window === 'undefined') return

    // Core Web Vitals
    this.observeWebVital('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1]
      this.reportWebVital('LCP', lastEntry.startTime)
    })

    this.observeWebVital('first-input', (entries) => {
      const firstEntry = entries[0]
      this.reportWebVital('FID', firstEntry.processingStart - firstEntry.startTime)
    })

    this.observeWebVital('layout-shift', (entries) => {
      let cls = 0
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          cls += entry.value
        }
      }
      this.reportWebVital('CLS', cls)
    })

    // Additional metrics
    this.observeWebVital('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.reportWebVital('FCP', entry.startTime)
        }
      }
    })

    this.observeWebVital('navigation', (entries) => {
      const [entry] = entries
      this.reportWebVital('TTFB', entry.responseStart - entry.requestStart)
    })
  }

  private observeWebVital(type: string, callback: (entries: any[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  private reportWebVital(name: string, value: number): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(value),
        non_interaction: true,
      })
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vital - ${name}: ${value.toFixed(2)}`)
    }
  }

  // Cleanup observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Performance measurement decorator
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const measurementName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      const id = performanceMonitor.startMeasurement(measurementName, {
        args: args.length,
        className: target.constructor.name,
        methodName: propertyKey,
      })

      try {
        const result = await originalMethod.apply(this, args)
        performanceMonitor.endMeasurement(id)
        return result
      } catch (error) {
        performanceMonitor.endMeasurement(id)
        throw error
      }
    }

    return descriptor
  }
}

// Resource loading optimization
export class ResourceLoader {
  private static loadedResources = new Set<string>()
  private static loadingPromises = new Map<string, Promise<any>>()

  // Preload critical resources
  static preloadResource(href: string, as: string, crossorigin?: string): void {
    if (typeof document === 'undefined' || this.loadedResources.has(href)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (crossorigin) link.crossOrigin = crossorigin

    document.head.appendChild(link)
    this.loadedResources.add(href)
  }

  // Lazy load JavaScript modules
  static async loadModule<T = any>(importFn: () => Promise<T>): Promise<T> {
    const key = importFn.toString()
    
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!
    }

    const promise = importFn()
    this.loadingPromises.set(key, promise)

    try {
      const result = await promise
      return result
    } catch (error) {
      this.loadingPromises.delete(key)
      throw error
    }
  }

  // Preload critical images
  static preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => this.preloadImage(url))
    )
  }

  private static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedResources.has(url)) {
        resolve()
        return
      }

      const img = new Image()
      img.onload = () => {
        this.loadedResources.add(url)
        resolve()
      }
      img.onerror = reject
      img.src = url
    })
  }
}

// Bundle analysis utilities
export function analyzeBundleSize(): void {
  if (typeof window === 'undefined') return

  // Analyze loaded scripts
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))

  console.group('Bundle Analysis')
  console.log(`Scripts loaded: ${scripts.length}`)
  console.log(`Stylesheets loaded: ${stylesheets.length}`)

  // Estimate bundle sizes (rough approximation)
  let totalEstimatedSize = 0
  scripts.forEach((script: any) => {
    if (script.src && !script.src.includes('http')) {
      // Rough estimation based on filename patterns
      const size = estimateFileSize(script.src)
      totalEstimatedSize += size
      console.log(`${script.src}: ~${(size / 1024).toFixed(1)}KB`)
    }
  })

  console.log(`Estimated total bundle size: ~${(totalEstimatedSize / 1024).toFixed(1)}KB`)
  console.groupEnd()
}

function estimateFileSize(filename: string): number {
  // Very rough estimation based on common patterns
  if (filename.includes('chunk')) return 50 * 1024 // 50KB
  if (filename.includes('vendor')) return 200 * 1024 // 200KB
  if (filename.includes('main')) return 100 * 1024 // 100KB
  return 30 * 1024 // 30KB default
}

// Loading state management
export class LoadingStateManager {
  private static loadingStates = new Map<string, boolean>()
  private static listeners = new Map<string, Set<(loading: boolean) => void>>()

  static setLoading(key: string, loading: boolean): void {
    this.loadingStates.set(key, loading)
    
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach(listener => listener(loading))
    }
  }

  static isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  static subscribe(key: string, listener: (loading: boolean) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    
    this.listeners.get(key)!.add(listener)
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  static getGlobalLoadingState(): boolean {
    return Array.from(this.loadingStates.values()).some(loading => loading)
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Initialize Web Vitals monitoring
  performanceMonitor.initWebVitals()

  // Log bundle analysis in development
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      setTimeout(analyzeBundleSize, 1000)
    })
  }
}

// Export performance utilities
export { performanceMonitor as default }