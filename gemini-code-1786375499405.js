const CACHE_NAME = 'wallet-tracker-v1';

// รายชื่อไฟล์ที่ต้องการให้โหลดเก็บไว้ในเครื่อง (เพื่อให้เปิดตอนไม่มีเน็ตได้)
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. ตอนติดตั้งแอป: ให้โหลดไฟล์ทั้งหมดด้านบนไปเก็บไว้ใน Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// 2. ตอนเปิดแอป: จัดการล้าง Cache ตัวเก่าทิ้ง ถ้ามีการอัปเดตเวอร์ชันใหม่
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ตอนดึงข้อมูล: ดึงหน้าเว็บจาก Cache มาแสดงถ้าไม่มีเน็ต
self.addEventListener('fetch', (event) => {
  // ให้ข้าม API สแกนสลิปไป เพราะต้องใช้เน็ตในการสแกน
  if (event.request.url.includes('api.ocr.space')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // ถ้ามีไฟล์ในเครื่องแล้วให้ดึงมาใช้เลย ถ้าไม่มีค่อยโหลดจากเน็ต
      return response || fetch(event.request);
    })
  );
});