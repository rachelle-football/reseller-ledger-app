var CACHE_NAME = "reseller-ledger-v1";
var APP_SHELL = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); }));
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

// Network-first for the app shell only. Firebase/Firestore calls and CDN scripts (cross-origin)
// are left completely alone so live data sync is never affected by this service worker.
self.addEventListener("fetch", function(event){
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req).then(function(res){
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){ return cached || caches.match("./index.html"); });
    })
  );
});
