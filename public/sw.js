// Service Worker para Meraki Centro de Entrenamiento (PWA)
const CACHE_NAME = "meraki-pwa-v1";

const PRECACHE_ASSETS = [
  "/",
  "/favicon.ico",
  "/logoGym.jpg",
  "/hero-gym.jpg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png"
];

// Instalación: precachea recursos esenciales y activa de inmediato
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Advertencia al precachear recursos:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: limpia cachés antiguas y toma control de los clientes
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: estrategia balanceada para PWA
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo manejar métodos GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignorar peticiones de extensiones o orígenes cruzados que no sean de assets
  if (url.origin !== self.location.origin) return;

  // Ignorar llamadas a APIs o rutas de autenticación
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/image")) {
    return;
  }

  // Para navegaciones (páginas HTML): Network First con fallback a cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Guardar copia de la página en cache si es válida
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallbackHome = await caches.match("/");
          return fallbackHome || Response.error();
        })
    );
    return;
  }

  // Para archivos estáticos (imágenes, fuentes, css, js): Cache First con actualización en segundo plano (stale-while-revalidate)
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

