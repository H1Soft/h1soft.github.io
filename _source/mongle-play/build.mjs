import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderHome,LANGUAGES,PAGE_PATHS,htmlLang,landingPath,escapeHTML as esc} from './home.js';
const source=path.dirname(fileURLToPath(import.meta.url)),out=path.resolve(source,'../../mongle/play');
const ORIGIN='https://h1soft.github.io',ROOT='/mongle/play/';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
fs.mkdirSync(out,{recursive:true});
const previousManifest=path.join(out,'build-manifest.json');
const prior=fs.existsSync(previousManifest)?JSON.parse(fs.readFileSync(previousManifest,'utf8')).files:[];
// Repeated local builds must not drop hashes still referenced by the deployed HTML.
let committed=[];
try{committed=JSON.parse(execFileSync('git',['show','HEAD:mongle/play/build-manifest.json'],{cwd:source,encoding:'utf8',stdio:['ignore','pipe','ignore']})).files;}catch{}
const retained=[...new Set([...prior,...committed])].filter(f=>/^[a-zA-Z0-9_/.-]+$/.test(f)&&!f.includes('..')&&/\.[0-9a-f]{12}\./.test(f));
for(const file of committed.filter(f=>retained.includes(f))){
 const target=path.join(out,file);
 if(!fs.existsSync(target)){try{const bytes=execFileSync('git',['show','HEAD:mongle/play/'+file],{cwd:source,stdio:['ignore','pipe','ignore']});fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}catch{}}
}
const written=new Set();
function put(name,bytes){fs.mkdirSync(path.dirname(path.join(out,name)),{recursive:true});fs.writeFileSync(path.join(out,name),bytes);written.add(name);return ROOT+name;}
function asset(name,bytes){const ext=path.extname(name),base=name.slice(0,-ext.length);return put(base+'.'+hash(bytes)+ext,bytes);}
const fontURLs={};
for(const file of fs.readdirSync(path.join(source,'assets/fonts'))){fontURLs[file]=asset('assets/fonts/'+file,fs.readFileSync(path.join(source,'assets/fonts',file)));}
for(const file of fs.readdirSync(path.join(source,'assets/licenses')))put('assets/licenses/'+file,fs.readFileSync(path.join(source,'assets/licenses',file)));
const seo=JSON.parse(fs.readFileSync(path.join(source,'seo.json'),'utf8'));
const packs={},locales={},pages={};
for(const locale of Object.keys(LANGUAGES)){
 const pack=JSON.parse(fs.readFileSync(path.join(source,'locales',locale+'.json'),'utf8'));
 const canonical=ORIGIN+PAGE_PATHS[locale],language=htmlLang(locale);
 const imagePath='/assets/mongle/'+language+'/01.webp';
 const image=ORIGIN+(fs.existsSync(path.resolve(source,'../..','.'+imagePath))?imagePath:'/assets/mongle/en/01.webp');
 pack.seo={...seo[locale],image,ogLocale:({ko:'ko_KR',en:'en_US',ja:'ja_JP',zh:'zh_CN','zh-Hant':'zh_TW',es:'es_ES',fr:'fr_FR',de:'de_DE',pt:'pt_BR',id:'id_ID',vi:'vi_VN'})[locale]};
 pack.schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:pack.seo.title,description:pack.seo.description,inLanguage:language,mainEntity:{'@id':canonical+'#app'}},
  {'@type':'WebApplication','@id':canonical+'#app',url:canonical,name:pack.seo.title,description:pack.seo.description,inLanguage:language,image,applicationCategory:'EntertainmentApplication',operatingSystem:'Any',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'KRW',url:canonical},publisher:{'@type':'Organization',name:'H1Soft',url:ORIGIN+'/'}}
 ]};
 packs[locale]=pack;locales[locale]=asset('locales/'+locale+'.json',json(pack));pages[locale]=PAGE_PATHS[locale];
}
const chars=JSON.parse(fs.readFileSync(path.join(source,'characters.json'),'utf8'));
const charURL=asset('characters.js','export default '+json(chars)+';\n');
const coreURL=asset('core.js',fs.readFileSync(path.join(source,'core.js')));
const homeURL=asset('home.js',fs.readFileSync(path.join(source,'home.js')));
const app=fs.readFileSync(path.join(source,'app.js'),'utf8').replace("'./core.js'",JSON.stringify(coreURL)).replace("'./characters.js'",JSON.stringify(charURL)).replace("'./home.js'",JSON.stringify(homeURL)).replace('__LOCALE_URLS__',JSON.stringify(locales));
const appURL=asset('app.js',app);
let css=fs.readFileSync(path.join(source,'style.css'),'utf8');
for(const [name,url]of Object.entries(fontURLs))css=css.replaceAll('./assets/fonts/'+name,url);
const cssURL=asset('style.css',css);
const alternates=Object.entries(PAGE_PATHS).map(([locale,url])=>'<link rel="alternate" hreflang="'+htmlLang(locale)+'" href="'+ORIGIN+url+'">').join('')+'<link rel="alternate" hreflang="x-default" href="'+ORIGIN+ROOT+'">';
const head='<link rel="stylesheet" href="'+cssURL+'">'+[charURL,coreURL,homeURL,appURL].map(href=>'<link rel="modulepreload" href="'+href+'">').join('')+
'<link rel="preload" as="font" type="font/woff2" crossorigin href="'+fontURLs['pretendard_regular.subset.woff2']+'">'+alternates;
const template=fs.readFileSync(path.join(source,'index.html'),'utf8');
for(const [locale,pack] of Object.entries(packs)){
 const values={LANG:htmlLang(locale),BRAND_FONT:['ja','zh','zh-Hant','vi'].includes(locale)?'system':'brand',TITLE:esc(pack.seo.title),DESCRIPTION:esc(pack.seo.description),CANONICAL:ORIGIN+PAGE_PATHS[locale],OG_LOCALE:pack.seo.ogLocale,IMAGE:pack.seo.image,HEAD_ASSETS:head,SCHEMA:json(pack.schema),LANDING:landingPath(locale),LANGUAGE_LABEL:esc(pack.ui.language),LANGUAGE_OPTIONS:Object.entries(LANGUAGES).map(([value,name])=>'<option value="'+value+'"'+(value===locale?' selected':'')+'>'+esc(name)+'</option>').join(''),HOME:renderHome(pack,chars,{lang:locale}),NOSCRIPT:esc(pack.seo.noscript),LOCALE:locale,INITIAL_LOCALE:json(pack),APP_URL:appURL};
 put(PAGE_PATHS[locale].slice(ROOT.length)+'index.html',template.replace(/__([A-Z_]+)__/g,(_,key)=>{if(!(key in values))throw Error('Unknown template key '+key);return values[key];}));
}
const xmlLinks=Object.entries(pages).map(([locale,url])=>'<xhtml:link rel="alternate" hreflang="'+htmlLang(locale)+'" href="'+ORIGIN+url+'"/>').join('')+'<xhtml:link rel="alternate" hreflang="x-default" href="'+ORIGIN+ROOT+'"/>';
put('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+Object.values(pages).map(url=>'<url><loc>'+ORIGIN+url+'</loc><lastmod>2026-10-07</lastmod>'+xmlLinks+'</url>').join('\n')+'\n</urlset>\n');
const files=[...written].filter(f=>!f.includes('licenses/')&&f!=='sitemap.xml').sort();
const revision=hash(files.map(f=>f+':'+hash(fs.readFileSync(path.join(out,f)))).join('\n'));
put('sw.js',`const CACHE='mongle-play-${revision}';
const ROOT=new URL('./',self.location.href);
const FILES=${JSON.stringify(files)};
const PAGES=${JSON.stringify(Object.values(pages).map(url=>url+'index.html'))};
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
`);
put('build-manifest.json',JSON.stringify({revision,locales,pages,app:appURL,style:cssURL,characters:charURL,core:coreURL,home:homeURL,fonts:fontURLs,files:[...written].sort()},null,2)+'\n');
// Retain the previous published hashes for tabs still running the prior application.
for(const entry of fs.readdirSync(out,{recursive:true,withFileTypes:true})){if(!entry.isFile())continue;const p=path.join(entry.parentPath??entry.path,entry.name),relative=path.relative(out,p).split(path.sep).join('/');if(!written.has(relative)&&!retained.includes(relative))fs.unlinkSync(p);}
console.log(JSON.stringify({out,revision,locales:Object.keys(locales),pages:Object.values(pages),files:written.size}));
