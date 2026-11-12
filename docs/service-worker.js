/* Service worker: the app shell (pages, styles, scripts, icons) stays cached, so the app opens even
   without a connection to the receiver. Calls to the receiver (/api, /ws) are never cached. */
const VERSION = "v0.4.6";
const CACHE = "glassremote-" + VERSION;
const SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./i18n.js", "./logos.js", "./manifest.webmanifest",
  "./lang/en.js", "./lang/it.js", "./lang/es.js", "./lang/fr.js", "./lang/de.js", "./lang/pt.js",
  "./assets/icon-192.png", "./assets/icon-512.png", "./assets/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("glassremote-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname === "/ws") return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      });
      // Serve from the cache right away (the app starts offline too) and refresh it quietly for next time.
      if (hit) { net.catch(() => {}); return hit; }
      return net.catch(() => caches.match("./index.html"));
    }),
  );
});
