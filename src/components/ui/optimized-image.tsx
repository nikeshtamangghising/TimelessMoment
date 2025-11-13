'use client'

import { useState, useRef, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string
  skeleton?: React.ReactNode
  lazyLoad?: boolean
  onLoadComplete?: () => void
  onError?: (error: any) => void
}

export default function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder-image.jpg',
  skeleton,
  lazyLoad = true,
  onLoadComplete,
  onError,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src as string)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(!lazyLoad)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Load images 50px before they enter viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazyLoad])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoadComplete?.()
  }

  const handleError = (error: any) => {
    setHasError(true)
    setImageSrc(fallback)
    onError?.(error)
  }

  const defaultSkeleton = (
    <div className={`animate-pulse bg-gray-300 ${className}`} style={{ ...props.style }} suppressHydrationWarning>
      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded" suppressHydrationWarning></div>
    </div>
  )

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} suppressHydrationWarning>
      {isInView ? (
        <>
          {/* Loading skeleton */}
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 z-10" suppressHydrationWarning>
              {skeleton || defaultSkeleton}
            </div>
          )}
          
          {/* Actual image */}
          <Image
            {...props}
            src={imageSrc}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            priority={!lazyLoad}
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            suppressHydrationWarning
          />
          
          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400" suppressHydrationWarning>
              <div className="text-center" suppressHydrationWarning>
                <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p className="text-xs">Image unavailable</p>
              </div>
            </div>
          )}
        </>
      ) : (
        // Placeholder while waiting for intersection
        skeleton || defaultSkeleton
      )}
    </div>
  )
}