self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Offline network fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never intercept API calls, Next.js internal assets, or Clerk auth requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.hostname.includes('clerk')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>LifeTrack - Connection Status</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
              .card { background: #1e293b; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #334155; max-width: 380px; shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
              h2 { margin-top: 0; color: #38bdf8; font-size: 1.25rem; font-weight: 800; }
              p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
              button { background: linear-gradient(to right, #2563eb, #4f46e5); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; cursor: pointer; margin-top: 1rem; width: 100%; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>LifeTrack Network Status</h2>
              <p>Re-establishing secure server connection. Please tap below to reload your dashboard.</p>
              <button onclick="window.location.reload()">Reload Application</button>
            </div>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    })
  );
});

// Background Sync Event: Sync offline steps to server when network reconnects
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-steps-data') {
    event.waitUntil(syncBackgroundStepsToServer());
  }
});

// Periodic Background Sync: Sync steps periodically even when app is closed
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'background-step-sync') {
    event.waitUntil(syncBackgroundStepsToServer());
  }
});

// Helper function to sync steps cached in IndexedDB to server
async function syncBackgroundStepsToServer() {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (let client of clients) {
      client.postMessage({ type: 'SYNC_OFFLINE_STEPS' });
    }
  } catch (err) {
    console.log("Service Worker background step sync notice:", err);
  }
}

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
