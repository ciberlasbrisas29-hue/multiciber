// Service Worker para PWA
const CACHE_NAME = 'multiciber-v2';
const urlsToCache = [
  '/',
  '/login',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  // Forzar actualización inmediata del Service Worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        // Forzar control inmediato de todas las páginas
        return self.clients.claim();
      });
    })
  );
});

// Estrategia: Network First, luego Cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const method = event.request.method;
  
  // NO interceptar peticiones que no sean GET, rutas de API, o rutas internas de Next.js
  if (
    method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.searchParams.has('_rsc') ||
    url.protocol === 'chrome-extension:' ||
    !url.href.startsWith(self.location.origin)
  ) {
    // Dejar que el navegador maneje estas peticiones normalmente
    // No usar event.respondWith() para estas peticiones
    return;
  }

  // Solo manejar peticiones GET que no sean de API
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas exitosas de GET requests estáticos
        if (response && response.status === 200 && response.type === 'basic') {
          // Clonar la respuesta antes de cachear
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Solo cachear si es una petición GET válida
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache).catch(() => {
                  // Ignorar errores de cacheo silenciosamente
                });
              }
            }).catch(() => {
              // Ignorar errores de apertura de cache
            });
        }
        
        return response;
      })
      .catch(() => {
        // Intentar obtener del cache solo para peticiones GET
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Network error', { status: 408 });
        });
      })
  );
});

