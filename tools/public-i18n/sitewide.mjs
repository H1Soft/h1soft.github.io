// Keep static store links, JSON-LD URLs and script-created links locale-aware.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localizeStoreUrl } from '../../js/store-links.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const skip = new Set(['.git','_source','node_modules','tools','metrics','admin','identity','play','go']);
async function walk(dir) {
  const files=[];
  for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
    if (entry.name.startsWith('.') || skip.has(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}
function localizeJson(value,lang) {
  if (Array.isArray(value)) return value.map(v=>localizeJson(v,lang));
  if (value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,localizeJson(v,lang)]));
  if (typeof value==='string' && /^https:\/\/(apps\.apple\.com|itunes\.apple\.com|play\.google\.com)\//.test(value)) return localizeStoreUrl(value,lang);
  return value;
}
let changed=0;
for (const file of await walk(root)) {
  const original=await fs.readFile(file,'utf8');let text=original;
  const lang=text.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'en';
  text=text.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(_,a,json,b)=>a+JSON.stringify(localizeJson(JSON.parse(json),lang))+b);
  // New landing pages already import the observer through their shared module.
  if (!text.includes('/js/public-i18n.mjs') && !text.includes('/js/store-link-observer.mjs') && text.includes('</body>')) {
    text=text.replace('</body>','<script type="module" src="/js/store-link-observer.mjs?v=20261007"></script>\n</body>');
  }
  if(text!==original){await fs.writeFile(file,text);changed++;}
}
console.log(JSON.stringify({storeRuntimeAndSchemaPagesChanged:changed}));
