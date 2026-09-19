// Service Worker لمعرض أبو زياد — بيخزن الموقع عشان يشتغل من غير نت بعد أول فتح
const CACHE_NAME = 'abu-ziyad-pos-v1';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon.png'
];

// عند التثبيت: نخزن الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// عند التفعيل: نحذف أي نسخ قديمة من الكاش
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// عند كل طلب: نجرب الكاش الأول، ولو الملف مش موجود نجرب النت، ولو مفيش نت نرجع نسخة الكاش القديمة لو موجودة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request).then((networkResponse) => {
        // لو الطلب نجح، نحدث نسخة الكاش عشان تفضل حديثة لأي مرة قادمة
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // مفيش نت: نرجع نسخة الكاش لو موجودة
        return cachedResponse;
      });

      // لو عندنا نسخة كاش، نرجعها فورًا (أسرع)، وفي الخلفية نحدثها من النت لو متاح
      return cachedResponse || networkFetch;
    })
  );
});
