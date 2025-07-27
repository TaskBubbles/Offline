const CACHE_NAME = 'task-bubbles-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/AddTaskButton.js',
  '/TaskBubble.js',
  '/audioManager.js',
  '/variables.js',
  '/save.js',
  '/installButton.js',
  '/zoom.js',
  '/matter.js',
  '/Pop.json',
  '/Pop.wav',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
  );
});
