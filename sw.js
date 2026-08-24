// ΛΕΞΙΣ service worker — caches the app shell so it opens with no internet
const CACHE = "lexis-v16";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(a =>
        // cache:'reload' bypasses the HTTP cache so we never install stale files
        fetch(a, { cache: "reload" }).then(r => { if (r.ok) return c.put(a, r); })
      ))
    ).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.hostname === "api.anthropic.com") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(e.request).then(res => {
        if (e.request.method === "GET" && res.ok && (url.origin === location.origin || url.hostname.includes("fonts.") || url.hostname.includes("jsdelivr.net"))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit)
    )
  );
});
