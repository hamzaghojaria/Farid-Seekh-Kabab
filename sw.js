/* =====================================================================
   Farid Seekh Kabab Center — service worker (offline support)
   ---------------------------------------------------------------------
   Lets the installed app open instantly and keep working on a weak or
   missing connection.

   How it works
     - On install, the core files (page, styles, scripts, phone-size photo,
       icons) are saved in the browser's cache.
     - The page itself: try the network first (so updates show up), fall
       back to the saved copy when offline.
     - Everything else from this site and the Google Fonts: serve the saved
       copy straight away, and refresh it in the background.
     - The map, WhatsApp, phone links etc. are never cached.

   AFTER CHANGING ANY FILE ON THE SITE: bump VERSION below (e.g. v2 → v3)
   so returning visitors get the new files instead of the old saved ones.
   ===================================================================== */

const VERSION = 'fsk-v3';

const CORE = [
  './',
  './index.html',
  './css/styles.css',
  './css/effects.css',
  './js/vendor/lenis.min.js',
  './js/core.js',
  './js/fire.js',
  './js/sections.js',
  './js/effects.js',
  './js/sound.js',
  './images/plate-800.webp',
  './images/plate-800.jpg',
  './images/icons/icon-192.png',
  './images/icons/icon-512.png',
  './manifest.webmanifest',
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Save the core files
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

// Delete caches from older versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  const isFont = FONT_HOSTS.includes(url.hostname);
  if (!sameSite && !isFont) return;   // map, WhatsApp etc.: let the browser handle it normally

  // The page: network first, saved copy when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Files and fonts: saved copy straight away, refreshed in the background
  event.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(req).then(saved => {
        const fresh = fetch(req)
          .then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; })
          .catch(() => saved);
        return saved || fresh;
      })
    )
  );
});
