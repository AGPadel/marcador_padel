const CACHE = 'padelscore-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Handle webhook: /punto?equipo=1 or /punto?equipo=2
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname === '/punto') {
    const equipo = url.searchParams.get('equipo');
    if (equipo === '1' || equipo === '2') {
      // Broadcast to all clients
      self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({ type: 'POINT', team: parseInt(equipo) }));
      });
      e.respondWith(new Response(JSON.stringify({ ok: true, equipo }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }));
    }
  }
});
