const CACHE='bodega-aseo-v2';
const APP=['./','./index.html','./styles.css','./app.js','./manifest.json','./icons/icon.svg','https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP).catch(()=>{})).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{if(e.request.method==='GET'&&x.ok){const copy=x.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return x}).catch(()=>caches.match('./index.html')))));
