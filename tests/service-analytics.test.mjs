import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../js/analytics.js',import.meta.url),'utf8');
function visit(choice,pathname='/attachment/play/'){
 const head=[],body=[],beacons=[];
 function element(){return {style:{},children:[],setAttribute(){},append(...nodes){this.children.push(...nodes)}}}
 const context={location:{hostname:'h1soft.github.io',origin:'https://h1soft.github.io',pathname,search:'?answer=private',hash:'#private'},document:{title:'PRIVATE result and answers',documentElement:{lang:'ko'},referrer:'https://example.com/from?secret=yes#private',head:{append:(...n)=>head.push(...n)},body:{append:(...n)=>body.push(...n)},createElement:element},localStorage:{getItem:()=>choice,setItem(){}},URL,fetch:(...call)=>{beacons.push(call);return Promise.resolve()}};
 context.window=context;
 runInNewContext(code,context);
 return {head,body,context,beacons};
}
test('new and declining visitors never load Google; allowing starts once with sanitized URLs',()=>{
 for(const choice of [null,'no']){const {head,context,body}=visit(choice);assert.equal(head.length,0);assert.equal(context.dataLayer,undefined);if(choice===null){body[1].children.find(n=>n.textContent==='허용').onclick();assert.equal(head.length,1);assert.equal(context.dataLayer.length,4);}}
 const {context,head,body}=visit('yes');runInNewContext(code,context);assert.equal(head.length,1);assert.equal(body.length,2);
 const config=context.dataLayer.find(row=>row[0]==='config')[2];assert.equal(config.page_location,'https://h1soft.github.io/attachment/play/');assert.equal(config.page_referrer,'https://example.com/from');assert.equal(config.allow_google_signals,false);
});
test('Metrics and excluded skin service never load analytics or show consent UI',()=>{
 for(const path of ['/metrics/','/skinping/','/pibuping/','/lol.dating/','/ko/skinping/','/en/lol.dating/','/gyeol/admin/','/gyeol/identity/','/gyeol/delete/','/gyeol/share/']){const {head,body}=visit('yes',path);assert.equal(head.length,0);assert.equal(body.length,0);}
});

test('Mongle test visits use a neutral title and omit result fragments and query strings',()=>{
 for(const path of ['/mongle/play/ko/','/mongle/play/ja/about/']){
  const {context}=visit('yes',path),config=context.dataLayer.find(row=>row[0]==='config')[2];
  assert.equal(config.page_title,'Mongle web personality test');assert.equal(config.page_location,'https://h1soft.github.io'+path);
  assert.ok(!JSON.stringify(context.dataLayer).includes('PRIVATE'));assert.ok(!JSON.stringify(context.dataLayer).includes('answer'));
 }
});

test('every visitor sends a cookieless path-only count, whatever the consent choice, and never on excluded pages',()=>{
 for(const choice of [null,'no','yes']){
  const {beacons}=visit(choice,'/attachment/play/');
  assert.equal(beacons.length,1);const [url,options]=beacons[0];
  assert.equal(url,'https://h1soft-metrics-api.h1soft-metrics.workers.dev/api/public/hit');
  assert.equal(options.body,'/attachment/play/');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.headers,undefined);
 }
 for(const path of ['/metrics/','/skinping/','/lol.dating/','/gyeol/admin/','/gyeol/share/'])assert.equal(visit(null,path).beacons.length,0);
});
test('a second load of the script on the same page does not count twice, and a blocked request cannot break the consent UI',()=>{
 const {context,beacons}=visit('yes');runInNewContext(code,context);assert.equal(beacons.length,1);
 for(const fetch of [()=>{throw new TypeError('blocked')},()=>Promise.reject(new TypeError('blocked'))]){context.__h1softAnalyticsLoaded=false;context.fetch=fetch;assert.doesNotThrow(()=>runInNewContext(code,context));}
});
