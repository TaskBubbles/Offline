const CACHE_NAME = 'task-bubbles-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'styles.css',
  'AddTaskButton.js',
  'TaskBubble.js',
  'app.js',
  'variables.js',
  'zoom.js',
  'audioManager.js',
  'save.js',
  'installButton.js',
  'matter.js',
  'Pop.wav',
  'Pop.json',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});

