const CACHE='mongle-play-831a4714439b';
const ROOT=new URL('./',self.location.href);
const FILES=["app.f595e413a287.js","assets/fonts/cafe24_ssurround.subset.7f61aa010331.woff2","assets/fonts/gaegu_bold.subset.ca4e69890a9f.woff2","assets/fonts/pretendard_bold.subset.be7727bf8a36.woff2","assets/fonts/pretendard_regular.subset.165bef67af1e.woff2","assets/fonts/pretendard_semibold.subset.81ea3c4a8b4d.woff2","characters.b4f8f38a82a5.js","core.10facb612c64.js","de/index.html","es/index.html","fr/index.html","home.b79119d5574d.js","id/index.html","index.html","ja/index.html","ko/index.html","locales/de.b79d3dad0ed4.json","locales/en.6f9aab64c990.json","locales/es.3d0b1f786a7a.json","locales/fr.7fcdb90f0e9e.json","locales/id.7868ab0a5c24.json","locales/ja.6935c14de498.json","locales/ko.11c7fe693297.json","locales/pt.b7a8650b2e78.json","locales/vi.36e466e0226d.json","locales/zh-Hant.087f70a2c5be.json","locales/zh.a66b155cbc3b.json","pt/index.html","style.577ace9eb6f0.css","vi/index.html","zh-Hant/index.html","zh/index.html"];
const PAGES=["/mongle/play/ko/index.html","/mongle/play/index.html","/mongle/play/ja/index.html","/mongle/play/zh/index.html","/mongle/play/zh-Hant/index.html","/mongle/play/es/index.html","/mongle/play/fr/index.html","/mongle/play/de/index.html","/mongle/play/pt/index.html","/mongle/play/id/index.html","/mongle/play/vi/index.html"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new URL(file,ROOT).href)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mongle-play-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(req.mode==='navigate'){
  const page=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
  if(!PAGES.includes(page))return;
  event.respondWith(fetch(req,{cache:'no-cache'}).catch(async()=>await caches.match(new URL(page,ROOT).href)||Response.error()));
  return;
 }
 if(!FILES.some(file=>new URL(file,ROOT).pathname===url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(req);if(cached)return cached;
  const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response;
 }));
});
