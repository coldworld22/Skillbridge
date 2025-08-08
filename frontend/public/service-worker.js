importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

const WARM_CACHE = 'SKILLBRIDGE-WARM-V1';
const warmCache = new workbox.strategies.CacheFirst({ cacheName: WARM_CACHE });

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'WARM_UP_CACHE') {
    event.waitUntil(
      caches.open(WARM_CACHE).then((cache) => cache.addAll(payload || []))
    );
  }
  if (type === 'CLEAR_WARM_CACHE') {
    event.waitUntil(caches.delete(WARM_CACHE));
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      self.skipWaiting();
      await clients.claim();
      const clientList = await clients.matchAll({ type: 'window' });
      clientList.forEach((client) =>
        client.postMessage({ type: 'NEW_VERSION' })
      );
    })()
  );
});
