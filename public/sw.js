// Manglam Vastralya - PWA Service Worker for Offline Ledger & Dashboard
const CACHE_NAME = 'manglam-vastralya-v1';

// Assets to cache immediately on SW install
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
];

// Install Event - Pre-cache the main root skeleton page
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core application shell');
      return cache.addAll(PRE_CACHE_ASSETS);
    })
  );
});

// Activate Event - Clean up any older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Determine if the request should be cached or ignored
function shouldCache(url) {
  // Ignore chrome extensions, dev-server HMR ports, hot reloads, etc.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.search && url.search.includes('ts=')) return false; // ignore raw cache-busters
  if (url.pathname.includes('/@vite/') || url.pathname.includes('/@react-refresh')) return false;
  return true;
}

// Fetch Event Interception
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Exclude non-cacheable items
  if (!shouldCache(requestUrl)) {
    return;
  }

  // Use a Stale-While-Revalidate strategy for static assets & dependencies in dev/production
  // This serves old cache instantly for perfect offline performance, but updates it silently behind the scenes.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Create network fetch request
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          // If response is valid, clone and cache it
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' || networkResponse.type === 'cors') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[Service Worker] Fetch failed, network may be offline:', err);
          // Return the cached response if available or fallback to standard index.html for general routes (SPA safety)
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return null;
        });

      // Serve cached content first, fall back to network, and then update cache in the background
      return cachedResponse || networkFetch;
    })
  );
});
