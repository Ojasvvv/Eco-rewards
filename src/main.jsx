import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Register service worker for PWA (skip in development)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Production: Register service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker registered:', registration);
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed:', error);
        });
    });
  } else {
    // Development: IMMEDIATELY unregister all service workers
    // This prevents conflicts with Vite HMR and dev server
    (async () => {
      try {
        // Unregister all service workers immediately
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length > 0) {
          console.log(`[DEV] Unregistering ${registrations.length} service worker(s)...`);
          
          // Unregister all service workers
          await Promise.all(
            registrations.map((registration) => {
              return registration.unregister().catch((err) => {
                console.warn('Failed to unregister service worker:', err);
              });
            })
          );
          
          // Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map((cacheName) => {
                console.log(`[DEV] Deleting cache: ${cacheName}`);
                return caches.delete(cacheName);
              })
            );
          }
          
          console.log('[DEV] ✅ All service workers and caches cleared!');
          console.log('[DEV] 💡 Hard refresh (Ctrl+Shift+R) if errors persist');
        }
      } catch (error) {
        console.error('[DEV] Error unregistering service workers:', error);
      }
    })();
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

