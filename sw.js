// Service worker : l'interface marche hors ligne ; les données TMDB restent en ligne (images mises en cache).
const SHELL = 'cine-shell-v9';
const IMGS = 'cine-img-v1';
const FILES = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'js/app.js', 'js/mood.js', 'js/tmdb.js', 'js/store.js', 'js/i18n.js', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/tmdb.svg'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => ![SHELL, IMGS].includes(k)).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'image.tmdb.org') {
    e.respondWith(caches.open(IMGS).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (url.origin === location.origin) {
    // réseau d'abord en revalidant (jamais une vieille copie du cache HTTP), cache si hors ligne
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { const cp = r.clone(); caches.open(SHELL).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  }
});
