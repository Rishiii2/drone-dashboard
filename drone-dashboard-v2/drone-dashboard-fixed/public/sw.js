self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Doing nothing, just letting the browser handle the fetch normally
  // This is the absolute minimum required to pass Chrome's PWA installability test
});
