const CACHE_NAME = 'notes-cache-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';

// Статические ресурсы App Shell (кэшируются при установке)
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-48x48.png',
  '/icons/favicon-180x180.png',
  '/icons/favicon-192x192.png',
  '/icons/favicon-512x512.png'
];

// Установка – кэшируем статику
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация – удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия: для динамического контента (/content/*) – Network First,
// для остального – Cache First (статика)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Пропускаем запросы к CDN (chota)
  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith('/content/')) {
    // Network First с fallback на кэш
    event.respondWith(
      fetch(event.request)
        .then(networkRes => {
          const resClone = networkRes.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
          return networkRes;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => cached || caches.match('/content/home.html'));
        })
    );
  } else {
    // Cache First для статики
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '' };
  if (event.data) {
    data = event.data.json();
  }
  const options = {
    body: data.body,
    icon: '/icons/favicon-192x192.png',
    badge: '/icons/favicon-48x48.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});