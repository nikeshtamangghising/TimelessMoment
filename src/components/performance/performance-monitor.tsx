'use client'

import { useEffect, useState } from 'react'
import { performanceMonitor, WebVitals } from '@/lib/performance'

interface PerformanceMonitorProps {
  enabled?: boolean
  showMetrics?: boolean
}

export default function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  showMetrics = false 
}: PerformanceMonitorProps) {
  const [webVitals, setWebVitals] = useState<WebVitals>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    // Initialize performance monitoring
    performanceMonitor.initWebVitals()

    // Listen for Web Vitals updates
    const handleWebVital = (name: string, value: number) => {
      setWebVitals(prev => ({ ...prev, [name]: value }))
    }

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            handleWebVital('LCP', entry.startTime)
            break
          case 'first-input':
            const fidEntry = entry as PerformanceEventTiming
            handleWebVital('FID', fidEntry.processingStart - fidEntry.startTime)
            break
          case 'layout-shift':
            const clsEntry = entry as any
            if (!clsEntry.hadRecentInput) {
              handleWebVital('CLS', clsEntry.value)
            }
            break
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              handleWebVital('FCP', entry.startTime)
            }
            break
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming
            handleWebVital('TTFB', navEntry.responseStart - navEntry.requestStart)
            break
        }
      }
    })

    // Observe different entry types
    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      observer.observe({ type: 'first-input', buffered: true })
      observer.observe({ type: 'layout-shift', buffered: true })
      observer.observe({ type: 'paint', buffered: true })
      observer.observe({ type: 'navigation', buffered: true })
    } catch (error) {
    }

    // Keyboard shortcut to toggle metrics display
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      observer.disconnect()
      window.removeEventListener('keydown', handleKeyPress)
      performanceMonitor.disconnect()
    }
  }, [enabled])

  if (!enabled || (!showMetrics && !isVisible)) {
    return null
  }

  const getScoreColor = (metric: string, value: number): string => {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    }

    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return 'text-gray-600'

    if (value <= threshold.good) return 'text-green-600'
    if (value <= threshold.poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatValue = (metric: string, value: number): string => {
    if (metric === 'CLS') {
      return value.toFixed(3)
    }
    return `${Math.round(value)}ms`
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Web Vitals</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        {Object.entries(webVitals).map(([metric, value]) => (
          <div key={metric} className="flex justify-between">
            <span>{metric}:</span>
            <span className={getScoreColor(metric, value)}>
              {formatValue(metric, value)}
            </span>
          </div>
        ))}
      </div>

      {Object.keys(webVitals).length === 0 && (
        <div className="text-gray-400">Collecting metrics...</div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}

// Hook for using performance metrics in components
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<WebVitals>({})

  useEffect(() => {
    const updateMetrics = () => {
      const performanceMetrics = performanceMonitor.getMetrics()
      // Process and update metrics
      setMetrics(prev => ({ ...prev }))
    }

    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [])

  return metrics
}

// Component for measuring render performance
export function RenderPerformanceTracker({ 
  name, 
  children 
}: { 
  name: string
  children: React.ReactNode 
}) {
  useEffect(() => {
    const id = performanceMonitor.startMeasurement(`render-${name}`)
    
    return () => {
      performanceMonitor.endMeasurement(id)
    }
  }, [name])

  return <>{children}</>
}