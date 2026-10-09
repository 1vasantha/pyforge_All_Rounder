const CACHE_NAME = 'aerovolt-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/i18n.js',
  './js/vehicleDatabase.js',
  './js/physicsRangeEngine.js',
  './js/stationsDatabase.js',
  './js/tripPlanner.js',
  './js/telemetryDashboard.js',
  './js/alertsEngine.js',
  './js/fleetManagement.js',
  './js/communityAndEcosystem.js',
  './js/apiClient.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Return offline fallback if network fails
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
