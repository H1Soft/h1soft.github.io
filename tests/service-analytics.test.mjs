import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../js/analytics.js',import.meta.url),'utf8');
function visit(choice,pathname='/attachment/play/'){
 const head=[],body=[];
 function element(){return {style:{},children:[],setAttribute(){},append(...nodes){this.children.push(...nodes)}}}
 const context={location:{hostname:'h1soft.github.io',origin:'https://h1soft.github.io',pathname,search:'?answer=private',hash:'#private'},document:{documentElement:{lang:'ko'},referrer:'https://example.com/from?secret=yes#private',head:{append:(...n)=>head.push(...n)},body:{append:(...n)=>body.push(...n)},createElement:element},localStorage:{getItem:()=>choice,setItem(){}},URL};
 context.window=context;
 runInNewContext(code,context);
 return {head,body,context};
}
test('new and declining visitors never load Google; allowing starts once with sanitized URLs',()=>{
 for(const choice of [null,'no']){const {head,context,body}=visit(choice);assert.equal(head.length,0);assert.equal(context.dataLayer,undefined);if(choice===null){body[1].children.find(n=>n.textContent==='허용').onclick();assert.equal(head.length,1);assert.equal(context.dataLayer.length,4);}}
 const {context,head,body}=visit('yes');runInNewContext(code,context);assert.equal(head.length,1);assert.equal(body.length,2);
 const config=context.dataLayer.find(row=>row[0]==='config')[2];assert.equal(config.page_location,'https://h1soft.github.io/attachment/play/');assert.equal(config.page_referrer,'https://example.com/from');assert.equal(config.allow_google_signals,false);
});
test('Metrics and excluded skin service never load analytics or show consent UI',()=>{
 for(const path of ['/metrics/','/skinping/','/pibuping/','/lol.dating/','/ko/skinping/','/en/lol.dating/','/gyeol/admin/','/gyeol/identity/','/gyeol/delete/','/gyeol/share/']){const {head,body}=visit('yes',path);assert.equal(head.length,0);assert.equal(body.length,0);}
});
