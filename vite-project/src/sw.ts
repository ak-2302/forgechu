declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {};
  console.log("Push event received:", payload);
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/favicon_192.png"
  }))
  console.log("pushed")
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(() => {
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    }),
  );
});