const CACHE = "winetastic-v4";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Only handle GET requests - never cache POST
  if (e.request.method !== "GET") return;
  
  // API calls — always network, never cache
  if (e.request.url.includes("/api/")) return;

  // Assets — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(response => {
      if (response.ok && e.request.method === "GET") {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return response;
    }))
  );
});
