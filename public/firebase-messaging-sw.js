importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAef0hFlHEWTise8yU88q-IYw7esxX2j54",
  authDomain: "bulk-notification-26726.firebaseapp.com",
  projectId: "bulk-notification-26726",
  storageBucket: "bulk-notification-26726.firebasestorage.app",
  messagingSenderId: "1094002262397",
  appId: "1:1094002262397:web:16f1fee5153ef171eb4c14"
});

const messaging = firebase.messaging();

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const raw = event.data.json();
    const d = raw.data || raw;

    const title = d.title || raw.notification?.title || 'Notification';
    const body = d.body || raw.notification?.body || '';
    const image = d.image || '';
    const link = d.link || '/';
    const notificationId = d.notificationId || '';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const activeClient = clientList.find(c => c.url.startsWith(self.location.origin) && c.visibilityState === 'visible');
        if (activeClient) return;

        return self.registration.showNotification(title, {
          body: body,
          icon: "/icons/icon-192.svg",
          image: image || undefined,
          badge: "/icons/icon-192.svg",
          tag: notificationId || 'notification',
          renotify: true,
          data: { url: link, notificationId: notificationId },
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' }
          ]
        });
      })
    );
  } catch (error) {
    console.error('[FCM] Push parse error:', error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const notificationId = event.notification.data?.notificationId;
  const targetUrl = notificationId
    ? `${self.location.origin}/?notification=${notificationId}`
    : (event.notification.data?.url || `${self.location.origin}/`);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then((focused) => {
            if (notificationId) {
              focused.navigate(targetUrl);
            }
            return focused;
          });
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_TOKEN':
        break;
    }
  }
});

const CACHE_NAME = 'firebase-messaging-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});
