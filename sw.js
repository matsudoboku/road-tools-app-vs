// Service Worker (GitHub Pages 等のサブパスでも動作するよう相対パスでキャッシュ)
const CACHE_NAME = 'road-tools-cache-v5'; // ←更新時は番号を上げる
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './sw.js',

  // JS（分割版）
  './js/constants.js',
  './js/state.js',
  './js/utils.js',
  './js/ui.js',
  './js/settings.js',
  './js/tables.js',
  './js/parts.js',
  './js/prices.js',
  './js/storage.js',
  './js/exports.js',
  './js/events.js',
  './js/main.js'
];

// インストール：静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // すぐに新SWへ切替
});

// 有効化：古いキャッシュを掃除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 取得：キャッシュ優先（なければネットワーク）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // オフライン時に HTML を要求されたら index.html を返す（簡易フォールバック）
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
