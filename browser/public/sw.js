/*global UVServiceWorker,__uv$config*/
importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts(__uv$config.sw);

const uv = new UVServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      if (uv.route(event)) {
        try {
          return await uv.fetch(event);
        } catch (err) {
          return new Response(`Proxy error: ${err && err.message ? err.message : err}`, {
            status: 502,
            headers: { "content-type": "text/plain" },
          });
        }
      }
      return fetch(event.request);
    })()
  );
});
