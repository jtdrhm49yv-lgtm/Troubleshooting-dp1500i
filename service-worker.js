/* Service worker - Depannage DP1500i
Permet le fonctionnement hors-ligne apres la premiere ouverture avec reseau. */

var CACHE = “depannage-cache-v1”;

/* Fichiers de l’app a garder hors-ligne */
var APP_FILES = [
“./”,
“./index.html”,
“./manifest.json”
];

/* Librairie OCR (Tesseract) - mise en cache au passage si le reseau le permet */
var CDN_FILES = [
“https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js”
];

self.addEventListener(“install”, function(e){
self.skipWaiting();
e.waitUntil(
caches.open(CACHE).then(function(cache){
/* on met d’abord les fichiers de l’app (essentiels) */
return cache.addAll(APP_FILES).then(function(){
/* puis on tente les CDN sans bloquer si ca echoue */
return Promise.all(CDN_FILES.map(function(u){
return cache.add(u).catch(function(){});
}));
});
})
);
});

self.addEventListener(“activate”, function(e){
e.waitUntil(
caches.keys().then(function(keys){
return Promise.all(keys.map(function(k){
if(k !== CACHE) return caches.delete(k);
}));
}).then(function(){ return self.clients.claim(); })
);
});

/* Strategie : cache d’abord, reseau ensuite, et on garde en cache au passage */
self.addEventListener(“fetch”, function(e){
if(e.request.method !== “GET”) return;
e.respondWith(
caches.match(e.request).then(function(cached){
if(cached) return cached;
return fetch(e.request).then(function(resp){
/* on copie dans le cache pour la prochaine fois (utile pour l’OCR) */
try{
var copy = resp.clone();
caches.open(CACHE).then(function(cache){ cache.put(e.request, copy).catch(function(){}); });
}catch(err){}
return resp;
}).catch(function(){
/* hors-ligne et pas en cache : on renvoie la page principale si c’est une navigation */
if(e.request.mode === “navigate”) return caches.match(”./index.html”);
});
})
);
});
