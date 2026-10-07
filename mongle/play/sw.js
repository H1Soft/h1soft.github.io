const CACHE='mongle-play-a9745b43121c';
const ROOT=new URL('./',self.location.href);
const FILES=["app.6e34ae33895a.js","assets/fonts/cafe24_ssurround.subset.7f61aa010331.woff2","assets/fonts/gaegu_bold.subset.ca4e69890a9f.woff2","assets/fonts/pretendard_bold.subset.be7727bf8a36.woff2","assets/fonts/pretendard_regular.subset.165bef67af1e.woff2","assets/fonts/pretendard_semibold.subset.81ea3c4a8b4d.woff2","characters.93ef7e095d58.js","core.10facb612c64.js","index.html","locales/de.ee5c1177d1a7.json","locales/en.2ee181644f4d.json","locales/es.deec967875e5.json","locales/fr.4c4d89065f6e.json","locales/id.73243e3bc3da.json","locales/ja.c4c1dab32339.json","locales/ko.46381f03f222.json","locales/pt.cbcc6e93c43e.json","locales/vi.00ece61adb5d.json","locales/zh-Hant.5937467cd31e.json","locales/zh.35288eb1ef53.json","style.623981e00d85.css"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new URL(file,ROOT).href)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mongle-play-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req,{cache:'no-cache'}).catch(async()=>await caches.match(new URL('index.html',ROOT).href)||Response.error()));
  return;
 }
 if(!FILES.some(file=>new URL(file,ROOT).pathname===url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(req);if(cached)return cached;
  const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response;
 }));
});
