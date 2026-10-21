const CACHE="h1-meowbro-ms-429de9e60bcc39ce",FILES=["h1-runtime.js", "icon-192.png", "icon-512.png", "index.apple-touch-icon.png", "index.audio.position.worklet.js", "index.audio.worklet.js", "index.html", "index.icon.png", "index.js", "index.pck", "index.png", "index.wasm", "manifest.webmanifest"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
const u=new URL(e.request.url),s=new URL(self.registration.scope);
if(u.origin!==s.origin||!u.pathname.startsWith(s.pathname))return;
const n=u.pathname.slice(s.pathname.length)||'index.html';if(!FILES.includes(n))return;
e.respondWith(caches.open(CACHE).then(async c=>(await c.match(new URL(n,s).href))||fetch(e.request)));});
