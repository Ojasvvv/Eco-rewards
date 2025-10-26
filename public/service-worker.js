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
  // Skip caching for POST, PUT, DELETE requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for external requests (Firebase, Google, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip caching during development (Vite HMR, node_modules, etc.)
  if (event.request.url.includes('/@vite/') || 
      event.request.url.includes('/node_modules/') ||
      event.request.url.includes('/@fs/') ||
      event.request.url.includes('/@id/') ||
      event.request.url.includes('.js?v=') ||
      event.request.url.includes('.ts?v=') ||
      event.request.url.includes('.jsx?v=') ||
      event.request.url.includes('.tsx?v=')) {
    // Just fetch, don't cache
    event.respondWith(fetch(event.request));
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
      .catch(() => {
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

