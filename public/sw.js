const CACHE_NAME='reelramp-pro-v1';
const CORE=['/','/offline.html','/favicon.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;if(new URL(req.url).pathname.startsWith('/api/'))return;event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));return res}).catch(()=>caches.match(req).then(cached=>cached||caches.match('/offline.html'))))});
