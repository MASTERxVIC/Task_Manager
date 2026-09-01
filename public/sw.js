// Background me Event Listen karne ke liye
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || '🚨 Board Update!';
  const options = {
    body: data.message || 'Aapko board me activity/mention mili hai.',
    icon: '/logo.png', // App Icon
    badge: '/badge.png', // Small Notification Tray Icon
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click par app open karne ke liye
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});