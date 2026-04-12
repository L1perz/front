const CACHE_NAME = 'notes-cache-v3';
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
  console.log('🔄 Service Worker устанавливается...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кэширование статических ресурсов');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('✅ Статические ресурсы закэшированы');
        return self.skipWaiting();
      })
      .catch(err => console.error('❌ Ошибка кэширования:', err))
  );
});

// Активация – удаляем старые кэши
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker активируется...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map(key => {
            console.log(`🗑️ Удаляем старый кэш: ${key}`);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('✅ Service Worker активирован');
      return self.clients.claim();
    })
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

// ========== ОБРАБОТКА PUSH-УВЕДОМЛЕНИЙ С КНОПКОЙ ==========
self.addEventListener('push', (event) => {
  console.log('📨 Получено push-сообщение');
  
  let data = { title: 'Новое уведомление', body: '', reminderId: null };
  
  if (event.data) {
    try {
      data = event.data.json();
      console.log('📊 Данные push:', JSON.stringify(data));
      console.log('🔑 reminderId:', data.reminderId);
    } catch (e) {
      console.error('❌ Ошибка парсинга JSON:', e);
      // Если не JSON, пробуем как текст
      data.body = event.data.text();
    }
  } else {
    console.log('⚠️ Push без данных');
  }

  const options = {
    body: data.body,
    icon: '/icons/favicon-192x192.png',
    badge: '/icons/favicon-48x48.png',
    data: { 
      reminderId: data.reminderId,
      url: '/' 
    },
    actions: [],
    requireInteraction: true,  // Уведомление не исчезает автоматически
    silent: false,
    vibrate: [200, 100, 200]   // Вибрация (если поддерживается)
  };

  // Добавляем кнопку "Отложить" ТОЛЬКО если есть reminderId
  if (data.reminderId) {
    options.actions = [
      { action: 'snooze', title: '⏰ Отложить на 5 минут' }
    ];
    console.log('✅ Кнопка "Отложить" ДОБАВЛЕНА');
  } else {
    console.log('❌ reminderId отсутствует, кнопка НЕ добавлена');
    console.log('   (это нормально для обычных задач)');
  }

  console.log('🔔 Показываем уведомление:', data.title);
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('✅ Уведомление показано'))
      .catch(err => console.error('❌ Ошибка показа уведомления:', err))
  );
});

// ========== ОБРАБОТКА НАЖАТИЯ НА УВЕДОМЛЕНИЕ ==========
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  
  console.log('🔘 Нажатие на уведомление');
  console.log('   Action:', action);
  console.log('   Notification data:', notification.data);

  // Закрываем уведомление
  notification.close();

  if (action === 'snooze') {
    const reminderId = notification.data.reminderId;
    console.log('⏰ Откладывание напоминания, reminderId:', reminderId);

    event.waitUntil(
      fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
        .then(response => {
          if (response.ok) {
            console.log('✅ Напоминание успешно отложено на 5 минут');
            // Показываем подтверждение
            return self.registration.showNotification('✅ Напоминание отложено', {
              body: 'Вы получите его через 5 минут',
              icon: '/icons/favicon-192x192.png',
              requireInteraction: false
            });
          } else {
            console.error('❌ Сервер вернул ошибку:', response.status);
            throw new Error('Server error');
          }
        })
        .catch(err => {
          console.error('❌ Ошибка при откладывании:', err);
          return self.registration.showNotification('❌ Ошибка', {
            body: 'Не удалось отложить напоминание',
            icon: '/icons/favicon-192x192.png'
          });
        })
    );
  } else {
    // Обычный клик по уведомлению — открываем или фокусируем приложение
    console.log('🔓 Открываем приложение');
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Если уже есть открытое окно, фокусируем его
          for (let client of windowClients) {
            if (client.url === '/' || client.url.includes('localhost')) {
              return client.focus();
            }
          }
          // Иначе открываем новое
          return clients.openWindow('/');
        })
    );
  }
});

// ========== ДОПОЛНИТЕЛЬНО: Обработка сообщений от клиента ==========
self.addEventListener('message', (event) => {
  console.log('📨 Сообщение от клиента:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});