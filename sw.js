// Wallet Tracker Service Worker
// Bump APP_CACHE_VERSION whenever the app shell changes.
const APP_CACHE_VERSION = '2026-11-25.3';
const CACHE_PREFIX = 'wallet-cache-';
const CACHE_NAME = `${CACHE_PREFIX}${APP_CACHE_VERSION}`;
const CORE_ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./lucian-cover.svg'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    Promise.all(CORE_ASSETS.map(url => cache.add(url).catch(err => console.error('[sw] precache fail:',url,err))))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req=event.request, url=new URL(req.url);
  if(req.method!=='GET' || url.origin!==self.location.origin) return;
  event.respondWith(fetch(req).then(networkRes => {
    if(networkRes && networkRes.ok){ const clone=networkRes.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(req,clone)).catch(()=>{}); }
    return networkRes;
  }).catch(async () => {
    const cached=await caches.match(req);
    if(cached) return cached;
    if(req.mode==='navigate') return caches.match('./index.html');
    return Response.error();
  }));
});
