'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'

export default function CacheClearer() {
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState('')

  const clearCache = async () => {
    setIsClearing(true)
    setMessage('')

    try {
      // Clear browser storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear server cache
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        setMessage('✅ Cache cleared successfully! Please refresh the page.')
        
        // Force page reload after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage('❌ Failed to clear server cache, but browser cache was cleared.')
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
      setMessage('❌ Error clearing cache. Please try refreshing the page manually.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <div className="text-sm text-gray-600 mb-2">
        Having issues with product data?
      </div>
      <Button
        onClick={clearCache}
        disabled={isClearing}
        size="sm"
        variant="outline"
        className="w-full"
      >
        {isClearing ? 'Clearing Cache...' : 'Clear Cache & Refresh'}
      </Button>
      {message && (
        <div className="mt-2 text-xs text-gray-600">
          {message}
        </div>
      )}
    </div>
  )
}

// Only show in development
export function CacheClearerWrapper() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return <CacheClearer />
}
