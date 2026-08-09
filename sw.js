// Service worker for บันทึกเงินพกพา.
// Caches the app shell (this page + icons) so it opens instantly and still
// works with no internet connection. Slip scanning still needs internet
// since that calls the OCR.space API — everything else works offline.

const CACHE_NAME = 'wallet-tracker-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests for our own origin (app shell). Let everything
  // else (OCR.space API calls, font CDN, etc.) go straight to the network —
  // no point caching a live OCR call or trying to work around cross-origin
  // fonts.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          // Keep the cache fresh for next time we're offline.
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached); // offline — fall back to whatever we have cached

      // Show the cached version immediately if we have one, update in background.
      return cached || network;
    })
  );
});
