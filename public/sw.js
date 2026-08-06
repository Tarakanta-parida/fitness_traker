self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Offline network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("LifeTrack is active in offline mode.");
    })
  );
});

// Handle Background Push Notifications (delivered when app/screen is closed)
self.addEventListener('push', (event) => {
  let payload = { title: 'LifeTrack Health Alert', message: 'Time for your healthy habit check-in!' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {}

  const options = {
    body: payload.message || payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [500, 250, 500, 250, 500],
    tag: payload.tag || 'lifetrack-reminder',
    renotify: true,
    data: { url: payload.url || '/dashboard' }
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Open application on tapping system notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
