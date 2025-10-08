/* eslint-disable no-restricted-globals */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_VERSION = 'V1';
const WARM_CACHE = `SKILLBRIDGE-WARM-${CACHE_VERSION}`;
const HTML_CACHE = `SKILLBRIDGE-HTML-${CACHE_VERSION}`;
const ASSET_CACHE = `SKILLBRIDGE-ASSETS-${CACHE_VERSION}`;
const IMAGE_CACHE = `SKILLBRIDGE-IMAGES-${CACHE_VERSION}`;
const JSON_CACHE = `SKILLBRIDGE-JSON-${CACHE_VERSION}`;

const WARM_PAGES = [
  '/',
  '/about',
  '/contact',
  '/marketplace',
  '/dashboard',
  '/ar',
  '/ar/about',
  '/ar/contact',
  '/ar/marketplace',
  '/ar/dashboard',
  '/offline.html',
];

const WARM_JSON = [
  '/api/public/config',
  '/api/public/categories',
  '/api/public/courses',
  '/ar/api/public/config',
  '/ar/api/public/categories',
  '/ar/api/public/courses',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(WARM_CACHE).then((cache) => cache.addAll([...WARM_PAGES, ...WARM_JSON]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [WARM_CACHE, HTML_CACHE, ASSET_CACHE, IMAGE_CACHE, JSON_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            return caches.delete(key);
          }
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: HTML_CACHE,
    networkTimeoutSeconds: 3,
  })
);

workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.mode === 'navigate') {
    return caches.match('/offline.html');
  }
  return Response.error();
});

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: ASSET_CACHE,
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: IMAGE_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request, url }) =>
    url.pathname.startsWith('/api') &&
    (url.pathname.endsWith('.json') || request.headers.get('accept')?.includes('application/json')),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: JSON_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 5 * 60,
      }),
    ],
  })
);

