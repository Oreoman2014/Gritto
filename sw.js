// This file MUST be uploaded to the very top level of your repo, right
// next to index.html — NOT inside any folder. Phones look for it at
// exactly yoursite.com/sw.js.

self.addEventListener('push', (event) => {
  let data = { title: 'Gritto', body: "Don't forget today's routine!" };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // fall back to the default above if the message wasn't valid JSON
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gritto', {
      body: data.body || "Don't forget today's routine!",
      icon: data.icon,
      badge: data.icon,
      tag: 'gritto-reminder',
    })
  );
});

// Tapping the notification opens (or focuses) the app instead of just
// dismissing it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
