// Push notification handler for service worker
self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Läxhjälpen", body: event.data?.text() || "" };
  }

  const title = data.title || "Läxhjälpen";
  const options = {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: data.tag || "default",
    data: { url: data.url || "/" },
    requireInteraction: true,
    vibrate: [300, 120, 300, 120, 400],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(url);
      })
  );
});
