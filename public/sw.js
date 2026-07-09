const CACHE = 'visit-alesund-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Always fresh from network for external APIs
  if (url.hostname.includes('met.no') || url.hostname.includes('yr.no')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Hashed static assets (_astro/*.js, _astro/*.css) — safe to cache forever.
  // Cache-first, but ONLY store a successful response: a transient 404/403 during
  // a redeploy must never be cached, or that asset URL breaks until the cache is
  // manually cleared.
  if (url.pathname.startsWith('/_astro/')) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) => cached || fetch(e.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
      )
    );
    return;
  }

  // HTML pages and schedule.json — network-first so updates reach the user.
  // Only cache OK responses; fall back to cache when offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
