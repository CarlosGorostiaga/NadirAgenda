const CACHE_NAME = 'gestor-avisos-v3'; // ⬅️ sube versión cuando cambies el SW

// Cache SOLO de lo imprescindible (mismo origen)
const CORE_ASSETS = ['/', '/manifest.json', '/pwa-register.js'];

// Helpers
function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isSupabase(url) {
  // Por si acaso: evita cualquier cosa supabase
  return url.hostname.includes('supabase.co');
}

function hasAuthHeader(request) {
  try {
    return request.headers.has('authorization') || request.headers.has('apikey');
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

// ✅ Estrategia:
// - HTML (navegación): network-first con fallback a cache (para que no se quede viejo)
// - Assets estáticos (js/css/img/font): stale-while-revalidate (rápido + actualizado)
// - TODO lo demás (incl. Supabase, auth, POST, cross-origin): pasar directo a network
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 0) Nunca cachees NO-GET
  if (req.method !== 'GET') return;

  // 1) Nunca metas mano a Supabase ni a cross-origin
  if (!isSameOrigin(url) || isSupabase(url)) return;

  // 2) Nunca cachees si hay headers de auth (por seguridad y porque rompe cosas)
  if (hasAuthHeader(req)) return;

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  // A) Navegación / HTML: network-first
  if (isHTML) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match(req);
          return cached || caches.match('/');
        }
      })()
    );
    return;
  }

  // B) Assets estáticos: stale-while-revalidate
  const isStatic =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/i) ||
    url.pathname.startsWith('/_astro/');

  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);

        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);

        return cached || (await fetchPromise) || fetch(req);
      })()
    );
    return;
  }

  // C) Resto: network
});
