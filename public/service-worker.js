// Service Worker for EcoRewards PWA
const CACHE_NAME = 'ecorewards-v2';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - network first, fall back to cache, then offline page
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;
  
  // CRITICAL: Completely disable service worker in development
  // Check if we're running on localhost (development environment)
  const isDevelopment = self.location.hostname === 'localhost' || 
                        self.location.hostname === '127.0.0.1' ||
                        self.location.hostname.includes('localhost') ||
                        requestUrl.includes('localhost') ||
                        requestUrl.includes('127.0.0.1');
  
  if (isDevelopment) {
    // Don't intercept ANY requests in development - let browser handle everything
    // Returning without event.respondWith() means service worker won't handle it
    return;
  }
  
  // CRITICAL: Skip ALL Vite dev server requests - additional safety check
  // This prevents service worker from interfering with HMR and dev server
  if (requestUrl.includes('/@vite/') || 
      requestUrl.includes('/@fs/') ||
      requestUrl.includes('/@id/') ||
      requestUrl.includes('/@react-refresh') ||
      requestUrl.includes('/@hmr') ||
      requestUrl.includes('?v=') ||
      requestUrl.includes('&v=') ||
      requestUrl.includes('?import') ||
      requestUrl.includes('?t=')) {
    // Don't intercept - let browser handle these requests normally
    return;
  }
  
  // Skip caching for POST, PUT, DELETE requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for external requests (Firebase, Google, etc.)
  if (!requestUrl.startsWith(self.location.origin)) {
    return;
  }

  // Skip caching for API requests (let them go through without interception)
  if (requestUrl.includes('/api/')) {
    return;
  }

  // Skip other dev server specific requests
  if (requestUrl.includes('/node_modules/') ||
      requestUrl.includes('/src/') ||
      requestUrl.includes('.js?v=') ||
      requestUrl.includes('.ts?v=') ||
      requestUrl.includes('.jsx?v=') ||
      requestUrl.includes('.tsx?v=') ||
      requestUrl.includes('.css?v=') ||
      requestUrl.includes('?v=') ||
      requestUrl.includes('&v=') ||
      requestUrl.includes('?import') ||
      requestUrl.includes('?t=')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful GET requests
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.error('Cache put failed:', error);
            });
        }
        return response;
      })
      .catch((error) => {
        // Log error but don't throw - handle gracefully
        console.warn('Network request failed, trying cache:', error);
        // If network fails, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If navigation request and not in cache, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // Return error response instead of throwing
            return new Response('Network error and no cache available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          })
          .catch((cacheError) => {
            // Even cache matching failed - return error response instead of throwing
            console.error('Cache match failed:', cacheError);
            return new Response('Service Unavailable', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
      .catch((finalError) => {
        // Final safety net - never let errors propagate unhandled
        console.error('Unhandled fetch error:', finalError);
        return new Response('Service Unavailable', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

