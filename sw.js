// 🔄 บันทึกเงินพกพา — Service Worker (auto-update)
//
// กลยุทธ์: Network-first สำหรับไฟล์แอป (HTML/JS/CSS/manifest)
// - ถ้าออนไลน์: ดึงเวอร์ชันล่าสุดจากเน็ตเสมอ แล้วอัปเดต cache ไว้เผื่อออฟไลน์
// - ถ้าออฟไลน์: ค่อย fallback ไปใช้ cache ที่เก็บไว้
//
// ทุกครั้งที่แก้ไข sw.js ไฟล์นี้ (แม้แค่ตัวอักษรเดียว) เบราว์เซอร์จะ byte-compare
// กับตัวที่ติดตั้งอยู่ แล้วรู้ว่ามีเวอร์ชันใหม่โดยอัตโนมัติ — ไม่ต้องไล่บัมพ์เลขเวอร์ชันเอง
// แต่ถ้าอยากบังคับ cache ใหม่ทั้งหมด ให้เปลี่ยนค่า CACHE_NAME ด้านล่างได้

const CACHE_NAME = 'wallet-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png'
];

// ติดตั้งทันที ไม่ต้องรอแท็บเก่าปิด
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

// เคลียร์ cache เวอร์ชันเก่า แล้วเข้าควบคุมทุกแท็บที่เปิดอยู่ทันที
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // ข้ามคำขอที่ไม่ใช่ GET หรือไปโดเมนอื่น (เช่น API พยากรณ์อากาศ)
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        const clone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        return networkRes;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
