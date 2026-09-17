import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

type PushPayload = {
  title?: unknown;
  body?: unknown;
  url?: unknown;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};

  try {
    payload = (event.data?.json() ?? {}) as PushPayload;
  } catch (error) {
    console.error("Push payloadの解析に失敗しました", error);
  }

  const title =
    typeof payload.title === "string" ? payload.title : "リマインダー";
  const body = typeof payload.body === "string" ? payload.body : "";
  const url = typeof payload.url === "string" ? payload.url : "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon_192.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const notificationUrl =
        typeof event.notification.data?.url === "string"
          ? event.notification.data.url
          : "/";
      const targetUrl = new URL(notificationUrl, self.location.origin).href;
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existingClient = windowClients.find(
        (client) => client.url === targetUrl,
      );

      if (existingClient) {
        return existingClient.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })(),
  );
});
