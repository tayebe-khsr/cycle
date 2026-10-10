// Offline support. Bump CACHE when shipping changes to icons/manifest.
const CACHE = 'cycle-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const put = res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };

  // The app page: network first so updates arrive, cached copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(put).catch(() => caches.match('./index.html')));
    return;
  }
  // Everything else (icons, fonts): cache first.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const sameOrigin = new URL(req.url).origin === location.origin;
    const font = /fonts\.(googleapis|gstatic)\.com/.test(req.url);
    return (res.ok && sameOrigin) || (font && (res.ok || res.type === 'opaque')) ? put(res) : res;
  })));
});
