// Global chunk loading error handler
export function setupChunkErrorHandler() {
  if (typeof window === 'undefined') return

  // Handle chunk loading errors
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Loading chunk') || 
        event.reason?.message?.includes('chunk') ||
        event.reason?.code === 'CHUNK_LOAD_ERROR') {
      event.preventDefault()
      window.location.reload()
    }
  })

  // Handle regular errors that might be chunk-related
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('Loading chunk') ||
        event.error?.message?.includes('chunk')) {
      event.preventDefault()
      window.location.reload()
    }
  })
}

// Retry function for failed chunk loads
export function retryChunkLoad(chunkName: string, maxRetries = 3): Promise<any> {
  return new Promise((resolve, reject) => {
    let retries = 0
    
    const attemptLoad = () => {
      retries++
      
      // Clear the chunk from cache to force reload
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('next')) {
              caches.open(cacheName).then(cache => {
                cache.keys().then(requests => {
                  requests.forEach(request => {
                    if (request.url.includes(chunkName)) {
                      cache.delete(request)
                    }
                  })
                })
              })
            }
          })
        })
      }
      
      // Try to reload the page
      if (retries <= maxRetries) {
        setTimeout(() => {
          window.location.reload()
        }, 1000 * retries) // Exponential backoff
      } else {
        reject(new Error(`Failed to load chunk ${chunkName} after ${maxRetries} retries`))
      }
    }
    
    attemptLoad()
  })
}
