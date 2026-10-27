const RELEASE='2.0.0';
const SCOPE=new URL('./',self.location.href).pathname;
const CACHE='schooltool-'+SCOPE+'-'+RELEASE;
const FILES=['./','./index.html','./styles.css','./update.css','./app.js','./model.js','./storage.js','./extras.js','./windows.js','./pwa.js','./schedule.js','./defaults.js','./icons.js','./manifest.webmanifest','./assets/wallpaper.svg','./assets/favicon.svg','./assets/app-192.png','./assets/app-512.png','./assets/WDHS-Bell-Schedules.pdf'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('schooltool-'+SCOPE+'-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE))return;
 // Prefer a consistent installed release. New releases activate only on request.
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>{if(event.request.mode==='navigate')return caches.match(new URL('./index.html',self.location.href));return Response.error();})));
});
