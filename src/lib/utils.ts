import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to combine classnames with support for conditional classes
 * Uses clsx for class name logic and tailwind-merge to resolve conflicting Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility function to format numbers as currency
 * Re-exported from currency module for backward compatibility
 */
export { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from './currency'

/**
 * Utility function to generate random ID
 */
export function generateId(length: number = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Utility function to debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Utility function to throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Utility function to capitalize first letter
 */
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Utility function to format file size
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Utility function to check if an object is empty
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0
  return Object.keys(obj).length === 0
}

/**
 * Utility function to deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (typeof obj === 'object') {
    const copy: any = {}
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone((obj as any)[key])
    })
    return copy
  }
  return obj
}

/**
 * Utility function to create a sleep/delay
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Utility function to check if code is running on client side
 */
export function isClient() {
  return typeof window !== 'undefined'
}

/**
 * Utility function to get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

/**
 * Utility function to format date in a relative format (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string) {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}