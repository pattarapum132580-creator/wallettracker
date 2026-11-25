// Wallet Tracker Service Worker
// Bump APP_CACHE_VERSION whenever the app shell changes.
const APP_CACHE_VERSION = '2026-11-25.5';
const CACHE_PREFIX = 'wallet-cache-';
const CACHE_NAME = `${CACHE_PREFIX}${APP_CACHE_VERSION}`;
const CORE_ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./lucian-cover.svg'];
const CORE_URLS = new Set(CORE_ASSETS.map(path => new URL(path,self.registration.scope).href));
const APP_URL = new URL('./index.html',self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(CORE_ASSETS))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  url.search = '';
  if (request.method !== 'GET' || !CORE_URLS.has(url.href)) return;
  event.respondWith((async () => {
    // Keep the cached app shell versioned as a unit. Mixing a new HTML page with
    // an older set of cached assets can break a launch while offline.
    try {
      const response = await fetch(request);
      if (response.ok) return response;
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(url.href)) || (request.mode === 'navigate' && await cache.match(APP_URL)) || response;
    } catch {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(url.href)) || (request.mode === 'navigate' && await cache.match(APP_URL)) || Response.error();
    }
  })());
});
