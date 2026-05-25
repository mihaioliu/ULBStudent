const CACHE_NAME = 'ulbstudent-premium-v4';
const APP_SHELL = [
  '/',
  '/index.html',
  '/404.html',
  '/offline.html',
  '/app-polish.css',
  '/styles-global.css',
  '/styles-professors.css',
  '/styles-documents.css',
  '/styles-subreddit.css',
  '/toast-notifications.css',
  '/auth.js',
  '/interactive.js',
  '/professors-filtering.js',
  '/professor-profile.js',
  '/supabase-client.js',
  '/profesori.html',
  '/documente.html',
  '/comments.html',
  '/discutie.html',
  '/contact.html',
  '/raporteaza-problema.html',
  '/login.html',
  '/register.html',
  '/profile.html',
  '/settings.html',
  '/termeni-conditii.html',
  '/politica-confidentialitate.html',
  '/assets/Logos%20and%20icons/ulbstudent-icon-circle.png',
  '/assets/Logos%20and%20icons/ulbstudent-icon-minimalist-bg-transparent.png',
  '/assets/Logos%20and%20icons/ulbstudent-icon-square.png',
  '/assets/Logos%20and%20icons/ulbstudent-logo-color.png',
  '/assets/Logos%20and%20icons/ulbstudent-logo-white.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch((error) => {
        console.warn('ULBStudent cache warmup failed:', error);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const isNavigation = request.mode === 'navigate';

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          if (isNavigation) {
            return caches.match('/offline.html');
          }
          return caches.match('/offline.html');
        });
    })
  );
});
