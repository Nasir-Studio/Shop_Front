var CACHE = 'shop-cache-v1';
var STATIC_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

// Install — cache critical static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(STATIC_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Only handle GET requests to our origin
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // For static assets (js/css/images), use cache-first
  if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request).then(function(response) {
          return caches.open(CACHE).then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // For navigation requests — network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/offline');
      })
    );
    return;
  }

  // Everything else — network only
  event.respondWith(fetch(event.request));
});
