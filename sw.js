// sw.js
const CACHE_NAME = 'road-tools-cache-v9'; // ← バージョンを必ず上げる
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // 必要なJSのみ（存在するものだけ）——迷ったら最小限に
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
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1つでも失敗しても install 全体は成功させる
      await Promise.allSettled(ASSETS.map(u => cache.add(u)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHTML  = event.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isAsset = /\.(?:js|css)$/.test(url.pathname);
  const forceNetwork = url.searchParams.has('nocache');

  // HTML/JS/CSS と ?nocache=1 は network-first
  if (isHTML || isAsset || forceNetwork) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // それ以外は cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      });
    })
  );
});
