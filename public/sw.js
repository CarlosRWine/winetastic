// Service worker desactivado temporalmente
// Se reactivará cuando la app esté estable

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});
// No interceptamos ningún fetch — todo va directo a red
