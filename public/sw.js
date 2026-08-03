var CACHE = 'shop-cache-v2';
var STATIC_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-96.png',
];

var NOTIF_DB = 'shop-notif-db';
var NOTIF_STORE = 'notifications';

// IndexedDB helper for notification history (shared with pages)
function openNotifDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(NOTIF_DB, 1);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(NOTIF_STORE)) {
        var store = db.createObjectStore(NOTIF_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('ts', 'ts');
      }
    };
    req.onsuccess = function() { resolve(req.result); };
    req.onerror = function() { reject(req.error); };
  });
}

function saveNotification(notif) {
  return openNotifDB().then(function(db) {
    return new Promise(function(resolve) {
      var tx = db.transaction(NOTIF_STORE, 'readwrite');
      tx.objectStore(NOTIF_STORE).add(notif);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { resolve(); };
    });
  });
}

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

  // For static assets (js/css/png/svg), use cache-first
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

// Push notification received — record history + show notification
self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  var title = data.title || '小羊農場';
  var body = data.body || '';
  var options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    data: { url: data.url || '/', ts: Date.now(), title: title, body: body },
  };
  event.waitUntil(
    saveNotif({ title: title, body: body, url: data.url || '/', ts: Date.now(), read: false })
      .then(function() {
        return self.registration.showNotification(title, options);
      })
  );
});

// Notification clicked — open the target page
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client && new URL(client.url).origin === self.location.origin) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});