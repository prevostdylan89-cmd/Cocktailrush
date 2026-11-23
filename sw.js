/* Cocktail Rush — service worker : l'appli s'ouvre même avec un mauvais réseau.
   La page est toujours rechargée depuis internet quand c'est possible (pour avoir la dernière version). */
const CACHE = 'cocktail-rush-v4';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol.startsWith('ws')) return;
  const sameOrigin = url.origin === location.origin;
  const isLib = /fonts\.(googleapis|gstatic)\.com|unpkg\.com/.test(url.host);
  if (!sameOrigin && !isLib) return;
  if (req.mode === 'navigate' || sameOrigin) {
    // réseau d'abord, cache en secours
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else {
    // polices + module réseau : cache d'abord
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
  }
});
