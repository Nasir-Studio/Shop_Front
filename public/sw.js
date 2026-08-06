var CACHE = 'shop-cache-v4';
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

// IndexedDB：通知紀錄（頁面與 SW 共用）
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

// 安裝：快取關鍵靜態資源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(STATIC_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 啟動：清除舊版快取
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

// 請求：網路優先，失敗才用快取
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // 只處理本站 GET 請求
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // 靜態資源（js/css/png/svg）快取優先
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

  // 頁面導覽：網路優先，失敗才用快取
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/offline');
      })
    );
    return;
  }

  // 其餘一律只走網路
  event.respondWith(fetch(event.request));
});

// 收到推播：寫入紀錄並顯示通知
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
    saveNotification({ title: title, body: body, url: data.url || '/', ts: Date.now(), read: false })
      .catch(function() { /* 儲存失敗不可阻擋通知 */ })
      .then(function() {
        return self.registration.showNotification(title, options);
      })
  );
});

// 點擊通知：開啟目標頁面
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