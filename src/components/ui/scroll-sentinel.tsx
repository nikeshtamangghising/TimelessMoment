'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface ScrollSentinelProps {
  onIntersect: () => void
  loading: boolean
  hasMore: boolean
  threshold?: string
  disabled?: boolean
  className?: string
}

export default function ScrollSentinel({
  onIntersect,
  loading,
  hasMore,
  threshold = '200px',
  disabled = false,
  className = ''
}: ScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastTriggerRef = useRef<number>(0)
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  
  // Adaptive debounce delay based on device type
  const getDebounceDelay = useCallback(() => {
    switch (deviceType) {
      case 'mobile': return 400 // Longer delay for mobile to handle touch scrolling
      case 'tablet': return 350 // Medium delay for tablet
      case 'desktop': return 250 // Shorter delay for desktop with precise scrolling
      default: return 300
    }
  }, [deviceType])

  // Detect device type on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const detectDeviceType = () => {
      const width = window.innerWidth
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024 && hasTouch) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    detectDeviceType()
    
    // Listen for resize events to update device type
    const handleResize = () => {
      detectDeviceType()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    const debounceDelay = getDebounceDelay()
    
    if (
      entry.isIntersecting && 
      hasMore && 
      !loading && 
      !disabled &&
      Date.now() - lastTriggerRef.current > debounceDelay
    ) {
      lastTriggerRef.current = Date.now()
      onIntersect()
    }
  }, [onIntersect, hasMore, loading, disabled, getDebounceDelay])

  // Fallback scroll handler for browsers without IntersectionObserver
  const handleScrollFallback = useCallback(() => {
    if (typeof window === 'undefined' || !sentinelRef.current) return
    
    const rect = sentinelRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const triggerPoint = parseInt(threshold.replace('px', '')) || 200
    
    if (rect.top <= windowHeight + triggerPoint && hasMore && !loading && !disabled) {
      const now = Date.now()
      const debounceDelay = getDebounceDelay()
      
      if (now - lastTriggerRef.current > debounceDelay) {
        lastTriggerRef.current = now
        onIntersect()
      }
    }
  }, [threshold, hasMore, loading, disabled, onIntersect, getDebounceDelay])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || typeof window === 'undefined') return

    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to scroll listener')
      
      const globalWindow = window as Window & typeof globalThis
      globalWindow.addEventListener('scroll', handleScrollFallback, { passive: true })
      globalWindow.addEventListener('resize', handleScrollFallback, { passive: true })
      
      return () => {
        globalWindow.removeEventListener('scroll', handleScrollFallback)
        globalWindow.removeEventListener('resize', handleScrollFallback)
      }
    }

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Adaptive intersection threshold based on device
    const getIntersectionThreshold = () => {
      switch (deviceType) {
        case 'mobile': return 0.05
        case 'tablet': return 0.08
        case 'desktop': return 0.1
        default: return 0.1
      }
    }

    try {
      // Create new observer with device-specific settings
      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: threshold,
        threshold: getIntersectionThreshold()
      })

      observerRef.current.observe(sentinel)
    } catch (error) {
      console.error('Error creating IntersectionObserver:', error)
      // Fallback to scroll listener if IntersectionObserver fails
      const globalWindow = window as Window & typeof globalThis
      globalWindow.addEventListener('scroll', handleScrollFallback, { passive: true })
      return () => globalWindow.removeEventListener('scroll', handleScrollFallback)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, handleScrollFallback, threshold, deviceType])

  // Don't render if there are no more items to load
  if (!hasMore) {
    return null
  }

  return (
    <div
      ref={sentinelRef}
      className={`h-4 w-full ${className}`}
      aria-hidden="true"
      data-testid="scroll-sentinel"
      data-device-type={deviceType}
      role="presentation"
      tabIndex={-1}
      suppressHydrationWarning
    />
  )
}