// Service Worker for PWA offline functionality
const CACHE_NAME = 'adhd-thoughts-v3';
const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v3';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png'
];

// Install service worker
self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {

        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
  
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch events - Cache First strategy for app shell, Network First for data
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle same-origin requests
  if (url.origin === location.origin) {
    // For navigation requests, try cache first then network
    if (request.mode === 'navigate') {
      event.respondWith(
        caches.match(request)
          .then((response) => {
            return response || fetch(request)
              .then((fetchResponse) => {
                return caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, fetchResponse.clone());
                    return fetchResponse;
                  });
              });
          })
          .catch(() => {
            // Fallback to cached index.html for SPA routing
            return caches.match('/index.html');
          })
      );
    } else {
      // For other requests, try cache first
      event.respondWith(
        caches.match(request)
          .then((response) => {
            return response || fetch(request)
              .then((fetchResponse) => {
                // Don't cache POST requests or errors
                if (request.method === 'GET' && fetchResponse.ok) {
                  const responseClone = fetchResponse.clone();
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                      cache.put(request, responseClone);
                    });
                }
                return fetchResponse;
              });
          })
      );
    }
  }
});

// Background sync for automatic backups
self.addEventListener('sync', (event) => {
  
  
  if (event.tag === 'backup-thoughts') {
    event.waitUntil(performBackup());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-backup') {
    event.waitUntil(performPeriodicBackup());
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ADHD Notes', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Backup functions
async function performBackup() {
  try {
    
    // This would integrate with the IndexedDB backup system
    // For now, just log the attempt
    return Promise.resolve();
  } catch (error) {
    throw error;
  }
}

async function performPeriodicBackup() {
  try {
    
    return Promise.resolve();
  } catch (error) {
    throw error;
  }
} 