self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Offline support fallback wrapper
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("You are currently offline, but the app launcher is active.");
    })
  );
});
