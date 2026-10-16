/* Service Worker for offline support */
const CACHE = "tusi-mathlab-v1";
const ASSETS = [
  "./", "./index.html", "./style.css",
  "./css/responsive.css", "./css/animations.css",
  "./script.js",
  "./js/tusi-math.js", "./js/cosmic-background.js",
  "./js/space-animation.js", "./js/particles-engine.js",
  "./js/gallery.js", "./js/audio-engine.js",
  "./js/vr-mode.js", "./js/commander.js",
  "./assets/images/tusi-logo.svg"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200 && res.type === "basic") {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => cached))
  );
});