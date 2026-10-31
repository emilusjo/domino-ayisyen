/* Domino Ayisyen: lets the game open with no internet.
   - the page itself: network first (so a new version arrives as soon as there is a connection), saved copy when offline
     or when the network is slower than 3 seconds
   - fonts and icons: saved copy first
   Change VERSION when the list of files changes. */
const VERSION = 'dk-31';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'fonts/bricolage-latin.woff2',
  'fonts/bricolage-latin-ext.woff2',
  'sounds/domino_place.wav', 'sounds/domino_draw.wav', 'sounds/domino_knock.wav', 'sounds/domino_shuffle.wav',
  'sounds/domino_slam_01.wav', 'sounds/domino_slam_02.wav', 'sounds/domino_slam_03.wav', 'sounds/final_domino.wav', 'sounds/victory.wav',
  'places/lakou.jpg', 'places/kafe.jpg', 'places/tonel.jpg', 'places/vil.jpg', 'places/plaj.jpg', 'places/mache.jpg', 'places/savann.jpg', 'places/kafou.jpg', 
  'places/mon.jpg', 'places/po.jpg', 'places/sitadel.jpg', 'places/jaden.jpg', 'places/lakay.jpg', 'places/fem.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function pageNetworkFirst(req) {
  return new Promise(resolve => {
    let settled = false;
    const settle = res => { if (!settled && res) { settled = true; resolve(res); } };
    const timer = setTimeout(() => { caches.match('index.html').then(settle); }, 3000);
    fetch(req).then(res => {
      clearTimeout(timer);
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('index.html', copy));
      }
      settle(res);
    }).catch(() => {
      clearTimeout(timer);
      caches.match('index.html').then(res => settle(res || Response.error()));
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (isPage) { e.respondWith(pageNetworkFirst(req)); return; }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || Response.error())))
  );
});
