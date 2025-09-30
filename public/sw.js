// Service Worker for caching and performance optimization

const CACHE_NAME = 'ecommerce-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'
const IMAGE_CACHE = 'images-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/products',
  '/categories',
  '/manifest.json',
  '/offline.html',
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network
  CACHE_FIRST: 'cache-first',
  // Network first, then cache
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  // Network only
  NETWORK_ONLY: 'network-only',
  // Cache only
  CACHE_ONLY: 'cache-only',
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request))
  }
})

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(request.url)
}

// Check if request is for API
function isAPIRequest(request) {
  return request.url.includes('/api/')
}

// Check if request is for static asset
function isStaticAsset(request) {
  return request.url.includes('/_next/static/') ||
         /\.(js|css|woff|woff2|ttf|eot)$/i.test(request.url)
}

// Check if request is for a page
function isPageRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'))
}

// Handle image requests - Cache first strategy
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Image request failed:', error)
    // Return placeholder image
    return new Response(
      '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af">Image unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
}

// Handle API requests - Network first strategy
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('API request failed, trying cache:', error)
    
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle static assets - Cache first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Static asset request failed:', error)
    return new Response('Asset unavailable', { status: 404 })
  }
}

// Handle page requests - Stale while revalidate strategy
async function handlePageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    // Fetch from network in background
    const networkPromise = fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone())
        }
        return networkResponse
      })
      .catch(() => null)

    // Return cached version immediately if available
    if (cachedResponse) {
      // Update cache in background
      networkPromise.catch(() => {})
      return cachedResponse
    }

    // Wait for network if no cache
    const networkResponse = await networkPromise
    
    if (networkResponse) {
      return networkResponse
    }

    // Return offline page as fallback
    return caches.match('/offline.html')
  } catch (error) {
    console.log('Page request failed:', error)
    return caches.match('/offline.html')
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Retry failed requests when connection is restored
  console.log('Background sync triggered')
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data,
      actions: data.actions || [],
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action) {
    // Handle action clicks
    clients.openWindow(event.action)
  } else {
    // Handle notification click
    clients.openWindow('/')
  }
})

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        )
      })
    )
  }
})

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent())
  }
})

async function syncContent() {
  // Sync critical content in background
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    
    // Preload critical pages
    const criticalPages = ['/', '/products', '/categories']
    
    for (const page of criticalPages) {
      try {
        const response = await fetch(page)
        if (response.ok) {
          await cache.put(page, response)
        }
      } catch (error) {
        console.log(`Failed to sync ${page}:`, error)
      }
    }
  } catch (error) {
    console.log('Content sync failed:', error)
  }
}