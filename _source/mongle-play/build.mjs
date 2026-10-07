import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source=path.dirname(fileURLToPath(import.meta.url)),out=path.resolve(source,'../../mongle/play');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
fs.mkdirSync(out,{recursive:true});
const previousManifest=path.join(out,'build-manifest.json');
const prior=fs.existsSync(previousManifest)?JSON.parse(fs.readFileSync(previousManifest,'utf8')).files:[];
const written=new Set();
function put(name,bytes){fs.mkdirSync(path.dirname(path.join(out,name)),{recursive:true});fs.writeFileSync(path.join(out,name),bytes);written.add(name);return './'+name;}
function asset(name,bytes){const ext=path.extname(name),base=name.slice(0,-ext.length);return put(base+'.'+hash(bytes)+ext,bytes);}
const fontURLs={};
for(const file of fs.readdirSync(path.join(source,'assets/fonts'))){fontURLs[file]=asset('assets/fonts/'+file,fs.readFileSync(path.join(source,'assets/fonts',file)));}
for(const file of fs.readdirSync(path.join(source,'assets/licenses')))put('assets/licenses/'+file,fs.readFileSync(path.join(source,'assets/licenses',file)));
const locales={};
for(const file of fs.readdirSync(path.join(source,'locales')).filter(f=>f.endsWith('.json'))){locales[file.slice(0,-5)]=asset('locales/'+file,fs.readFileSync(path.join(source,'locales',file)));}
const chars=JSON.parse(fs.readFileSync(path.join(source,'characters.json'),'utf8'));
const charURL=asset('characters.js','export default '+JSON.stringify(chars)+';\n');
const coreURL=asset('core.js',fs.readFileSync(path.join(source,'core.js')));
let app=fs.readFileSync(path.join(source,'app.js'),'utf8').replace("'./core.js'",JSON.stringify(coreURL)).replace("'./characters.js'",JSON.stringify(charURL)).replace('__LOCALE_URLS__',JSON.stringify(locales));
const appURL=asset('app.js',app);
let css=fs.readFileSync(path.join(source,'style.css'),'utf8');
for(const [name,url]of Object.entries(fontURLs))css=css.replaceAll('./assets/fonts/'+name,url);
const cssURL=asset('style.css',css);
const head='<link rel="stylesheet" href="'+cssURL+'">'+[charURL,coreURL,appURL].map(href=>'<link rel="modulepreload" href="'+href+'">').join('')+
'<link rel="preload" as="font" type="font/woff2" crossorigin href="'+fontURLs['pretendard_regular.subset.woff2']+'">'+
Object.entries(locales).map(([locale])=>'<link rel="alternate" hreflang="'+(locale==='zh'?'zh-Hans':locale)+'" href="https://h1soft.github.io/mongle/play/?lang='+locale+'">').join('');
put('index.html',fs.readFileSync(path.join(source,'index.html'),'utf8').replace('__HEAD_ASSETS__',head).replace('__BOOT_CHARACTER__',chars['ENFP-happy']).replace('__APP_URL__',appURL));
const files=[...written].filter(f=>!f.includes('licenses/')).sort();
const revision=hash(files.map(f=>f+':'+hash(fs.readFileSync(path.join(out,f)))).join('\n'));
put('sw.js',`const CACHE='mongle-play-${revision}';
const ROOT=new URL('./',self.location.href);
const FILES=${JSON.stringify(files)};
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
`);
put('build-manifest.json',JSON.stringify({revision,locales,app:appURL,style:cssURL,characters:charURL,core:coreURL,fonts:fontURLs,files:[...written].sort()},null,2)+'\n');
// Remove only stale output from a prior run of this builder in the dedicated new play directory.
for(const entry of fs.readdirSync(out,{recursive:true,withFileTypes:true})){if(!entry.isFile())continue;const p=path.join(entry.parentPath??entry.path,entry.name),relative=path.relative(out,p).split(path.sep).join('/');if(!written.has(relative)&&!prior.some(f=>f===relative&&/\.[0-9a-f]{12}\./.test(f)))fs.unlinkSync(p);}
console.log(JSON.stringify({out,revision,locales:Object.keys(locales),files:written.size}));
