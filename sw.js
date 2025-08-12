// sw.js
const CACHE_NAME = 'road-tools-cache-v8'; // ← 変更ごとに上げる
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // 必要に応じて主要JSを列挙（または動的取得に任せる）
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
  './js/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // すぐ新SWをアクティブ化
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim(); // 既存ページにも即適用
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isAsset = /\.(?:js|css)$/.test(url.pathname);

  // ?nocache=1 が付いてたら常にネット優先
  const forceNetwork = url.searchParams.has('nocache');

  if (isHTML || isAsset || forceNetwork) {
    // network-first
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // それ以外（画像やアイコンなど）は cache-first + フォールバック
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
            return res;
          })
        );
      })
    );
  }
});
