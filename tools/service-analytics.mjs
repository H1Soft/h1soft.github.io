// Run from this repository before publishing: node tools/service-analytics.mjs --write
// CI uses the default read-only check to catch new pages or rebuilt sites without tracking.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const services=['qr-scanner','seukscan','ongle','cleaner','attachment','mongle','nonogram','sudoku','sagak','meowbro'];
const match=new RegExp(`^(?:[A-Za-z]{2}(?:-[A-Za-z]{2,4})?/)?(${services.join('|')})(?:/|$)`);
const files=execFileSync('git',['ls-files','-z','*.html'],{encoding:'utf8'}).split('\0').filter(p=>match.test(p));
const tag='<script defer src="/js/analytics.js?v=services-20260930"></script>';
const missing=[],counts={};let redirects=0;
for(const file of files){
 const html=readFileSync(file,'utf8'),key=file.match(match)[1];
 // Redirect stubs do not represent a second visit; the destination is tracked.
 if(/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)){redirects++;continue;}
 counts[key]=(counts[key]??0)+1;
 if(/<script\b[^>]*src=["'][^"']*\/js\/analytics\.js(?:\?[^"']*)?["']/i.test(html))continue;
 if(!/<\/head>/i.test(html))throw Error(`Missing head: ${file}`);
 if(process.argv.includes('--write'))writeFileSync(file,html.replace(/<\/head>/i,tag+'\n</head>'));
 else missing.push(file);
}
for(const key of services)if(!counts[key])throw Error(`Missing service: ${key}`);
console.log(JSON.stringify({pages:counts,redirects,missing},null,2));
if(missing.length)process.exitCode=1;
