import { ImageProps } from 'next/image'

// Image optimization configuration
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 150, height: 150 },
  SMALL: { width: 300, height: 300 },
  MEDIUM: { width: 600, height: 600 },
  LARGE: { width: 1200, height: 1200 },
  HERO: { width: 1920, height: 1080 },
} as const

export const IMAGE_QUALITY = {
  LOW: 50,
  MEDIUM: 75,
  HIGH: 90,
  LOSSLESS: 100,
} as const

// Generate optimized image props for Next.js Image component
export function generateImageProps(
  src: string,
  alt: string,
  size: keyof typeof IMAGE_SIZES = 'MEDIUM',
  quality: keyof typeof IMAGE_QUALITY = 'HIGH'
): Partial<ImageProps> {
  const dimensions = IMAGE_SIZES[size]
  const imageQuality = IMAGE_QUALITY[quality]

  return {
    src,
    alt,
    width: dimensions.width,
    height: dimensions.height,
    quality: imageQuality,
    placeholder: 'blur',
    blurDataURL: generateBlurDataURL(dimensions.width, dimensions.height),
    sizes: generateSizes(size),
  }
}

// Generate responsive sizes string
export function generateSizes(size: keyof typeof IMAGE_SIZES): string {
  switch (size) {
    case 'THUMBNAIL':
      return '(max-width: 768px) 100px, 150px'
    case 'SMALL':
      return '(max-width: 768px) 200px, 300px'
    case 'MEDIUM':
      return '(max-width: 768px) 300px, (max-width: 1200px) 400px, 600px'
    case 'LARGE':
      return '(max-width: 768px) 400px, (max-width: 1200px) 600px, 1200px'
    case 'HERO':
      return '100vw'
    default:
      return '(max-width: 768px) 300px, 600px'
  }
}

// Generate blur placeholder data URL
export function generateBlurDataURL(width: number, height: number): string {
  const canvas = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`
}

// Product image optimization
export function getProductImageProps(
  imageUrl: string | null,
  productName: string,
  variant: 'thumbnail' | 'card' | 'detail' | 'hero' = 'card'
): Partial<ImageProps> {
  const fallbackImage = '/images/product-placeholder.jpg'
  const src = imageUrl || fallbackImage
  
  const sizeMap = {
    thumbnail: 'THUMBNAIL' as const,
    card: 'MEDIUM' as const,
    detail: 'LARGE' as const,
    hero: 'HERO' as const,
  }

  return generateImageProps(
    src,
    productName,
    sizeMap[variant],
    'HIGH'
  )
}

// Avatar image optimization
export function getAvatarImageProps(
  imageUrl: string | null,
  userName: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): Partial<ImageProps> {
  const fallbackImage = '/images/avatar-placeholder.jpg'
  const src = imageUrl || fallbackImage
  
  const sizeMap = {
    small: 'THUMBNAIL' as const,
    medium: 'SMALL' as const,
    large: 'MEDIUM' as const,
  }

  return generateImageProps(
    src,
    `${userName} avatar`,
    sizeMap[size],
    'HIGH'
  )
}

// Image preloading for critical images
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    if (priority === 'high') {
      link.fetchPriority = 'high'
    }
    document.head.appendChild(link)
  }
}

// Batch preload multiple images
export function preloadImages(images: Array<{ src: string; priority?: 'high' | 'low' }>): void {
  images.forEach(({ src, priority = 'low' }) => {
    preloadImage(src, priority)
  })
}

// Image lazy loading intersection observer
export function createImageObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Image format detection and optimization
export function getOptimalImageFormat(): 'webp' | 'avif' | 'jpeg' {
  if (typeof window === 'undefined') {
    return 'jpeg'
  }

  // Check for AVIF support
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  
  try {
    if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      return 'avif'
    }
  } catch (e) {
    // AVIF not supported
  }

  // Check for WebP support
  try {
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return 'webp'
    }
  } catch (e) {
    // WebP not supported
  }

  return 'jpeg'
}

// Generate srcSet for responsive images
export function generateSrcSet(
  baseSrc: string,
  sizes: Array<{ width: number; suffix?: string }>
): string {
  return sizes
    .map(({ width, suffix = '' }) => {
      const src = suffix ? baseSrc.replace(/\.[^.]+$/, `${suffix}$&`) : baseSrc
      return `${src} ${width}w`
    })
    .join(', ')
}

// Image compression utility (for client-side)
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Image validation
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or AVIF image.',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload an image smaller than 10MB.',
    }
  }

  return { valid: true }
}