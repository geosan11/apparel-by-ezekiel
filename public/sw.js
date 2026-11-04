const CACHE_VERSION = 'v1.0.0';
const SHELL_CACHE = `apparel-shell-${CACHE_VERSION}`;
const IMAGE_CACHE = `apparel-images-${CACHE_VERSION}`;
const ML_CACHE = 'apparel-ml-movenet-lightning-4';
const MAX_IMAGE_ENTRIES = 50;

const PRECACHE_SHELL = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest.webmanifest',
  '/images/logo.svg',
  '/images/hero.svg'
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_SHELL).catch((err) => {
        console.warn('Precache partial fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== IMAGE_CACHE && !key.startsWith('apparel-ml-')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache trim helper (LRU entry cap)
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    trimCache(cacheName, maxEntries);
  }
}

// Fetch routing
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never serve stale data responses (Supabase, API endpoints, or non-GET)
  if (
    request.method !== 'GET' ||
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.hostname.includes('supabase.co')
  ) {
    return; // Pass through to network directly
  }

  // 2. ML Model: MoveNet SinglePose Lightning v4 (cache-first, put on first fetch, long-lived)
  if (url.pathname.startsWith('/vendor/movenet/')) {
    event.respondWith(
      caches.open(ML_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return cached || new Response('', { status: 408, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // 3. Images: Cache-first with entry cap
  if (
    request.destination === 'image' ||
    /\.(svg|png|jpg|jpeg|webp|gif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
            trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
          }
          return networkResponse;
        } catch (err) {
          // If offline and image not cached, return empty or fallback
          return cached || new Response('', { status: 408, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // 3. Navigation / HTML / App Shell: Network-first with cache fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          if (url.pathname.includes('admin')) {
            return caches.match('/admin.html');
          }
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 4. Static assets (CSS, JS, Fonts): Stale-while-revalidate or Network-first
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
