const CACHE_NAME = 'wallet-tracker-auto';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. ติดตั้ง Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // บังคับให้ใช้ Service Worker ตัวใหม่ทันที
  self.skipWaiting();
});

// 2. เคลียร์ Cache ตัวเก่า (ถ้ามี)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. กลยุทธ์ Network-First (โหลดจากเน็ตก่อน ถ้าไม่มีเน็ตค่อยดึงจาก Cache)
self.addEventListener('fetch', (event) => {
  // ข้ามการแคช API สแกนสลิป
  if (event.request.url.includes('api.ocr.space') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // ถ้ามีอินเทอร์เน็ต โหลดโค้ดใหม่มาสำเร็จ -> ให้บันทึกทับลง Cache ด้วย เพื่อเก็บของใหม่ล่าสุดไว้ใช้ออฟไลน์
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // ถ้าไม่มีอินเทอร์เน็ต (ออฟไลน์) -> ดึงข้อมูลจาก Cache ที่เก็บไว้มาแสดง
        return caches.match(event.request);
      })
  );
});