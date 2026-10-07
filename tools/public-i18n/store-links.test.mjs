import test from 'node:test';
import assert from 'node:assert/strict';
import { localizeStoreUrl } from '../../js/store-links.mjs';
const cases={de:['de','de'],en:['us','en-US'],es:['es','es-ES'],fa:['us','en-US'],fr:['fr','fr-FR'],id:['id','id'],it:['it','it'],nl:['nl','nl'],pl:['pl','pl'],pt:['br','pt-BR'],ru:['ru','ru'],tr:['tr','tr'],vi:['vn','vi'],'zh-CN':['cn','zh-Hans'],'zh-TW':['tw','zh-Hant'],ko:['kr','ko'],ja:['jp','ja']};
for(const [lang,[country,l]] of Object.entries(cases))test(`Apple locale ${lang}`,()=>{
 const u=new URL(localizeStoreUrl('https://apps.apple.com/kr/app/meowbro/id6819049763?l=ko&ct=site#details',lang));
 assert.equal(u.pathname,`/${country}/app/meowbro/id6819049763`);assert.equal(u.searchParams.get('l'),l);assert.equal(u.searchParams.get('ct'),'site');assert.equal(u.hash,'#details');
 assert.equal(localizeStoreUrl(u.href,lang),u.href);
});
for(const [lang,hl] of Object.entries({In:'id','zh-rCN':'zh-CN','zh-rTW':'zh-TW',fa:'fa',pt:'pt-BR'}))test(`Google locale alias ${lang}`,()=>{
 const u=new URL(localizeStoreUrl('https://play.google.com/store/apps/details?id=app.test&hl=ko',lang));assert.equal(u.searchParams.get('hl'),hl);assert.equal(u.searchParams.get('id'),'app.test');
});
test('Unrelated HTTPS URLs stay untouched',()=>assert.equal(localizeStoreUrl('https://example.org/a?l=ko','de'),'https://example.org/a?l=ko'));
