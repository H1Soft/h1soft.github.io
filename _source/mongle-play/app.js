import {score,encodeResult,decodeResult,validProgress} from './core.js';
import CHARACTERS from './characters.js';
import {renderHome,LANGUAGES,PAGE_PATHS,htmlLang,landingPath} from './home.js';
const LOCALE_URLS=__LOCALE_URLS__;
const app=document.querySelector('#app'),modal=document.querySelector('#modal'),selector=document.querySelector('#language');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nl=s=>esc(s).replace(/\n/g,'<br>');
let data,lang='en',view='home',mode='speed',answers=[],locked=false,result=null,revealTimer,toastTimer;
let storageWorks=true,navigationVersion=0,languageBusy=false;
const localeCache=new Map();
const initialPack=document.querySelector('#initial-locale');
if(initialPack){try{localeCache.set(initialPack.dataset.locale,JSON.parse(initialPack.textContent));}catch{}}
const tr=(key,args={})=>(data?.ui[key]??key).replace(/\{(\w+)\}/g,(_,k)=>String(args[k]??''));
const tx=(key,args)=>esc(tr(key,args));
const lines=(key,args)=>nl(tr(key,args));
const icons={
close:'<path d="m6 6 12 12M18 6 6 18"/>',
back:'<path d="m15 5-7 7 7 7"/>',
share:'<path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8"/>',
link:'<path d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M13 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"/>',
download:'<path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/>'};
const icon=name=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
// Characters are bundled font-free vectors: no per-screen request or image decode.
const char=(type,mood='happy',cls='')=>'<span class="character '+cls+'" role="img" aria-label="'+tx('characterAlt',{type})+'">'+CHARACTERS[type+'-'+mood]+'</span>';
function read(key){try{return JSON.parse(localStorage.getItem('mongle-web-v1-'+key));}catch{return null;}}
function write(key,value){try{value===null?localStorage.removeItem('mongle-web-v1-'+key):localStorage.setItem('mongle-web-v1-'+key,JSON.stringify(value));}catch{storageWorks=false;}}
function progress(){const p=read('progress');return validProgress(p,data.questions)?p:null;}
function toast(text){clearTimeout(toastTimer);const el=document.querySelector('#toast');el.textContent=text;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,2800);}
function setup(html,kind,focus=true){
 view=kind;app.className='app '+kind;app.innerHTML=html;window.scrollTo(0,0);
 if(focus){const h=app.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
}
function modeTitle(m){return tr(m==='precise'?'preciseTitle':'speedTitle');}
function goHome(){navigationVersion++;clearTimeout(revealTimer);locked=false;modal.close();history.pushState(null,'',location.pathname+location.search);home();}
function home(){
 document.title=data.seo.title;
 const p=progress(),saved=read('result'),last=saved?decodeResult(encodeResult(saved)):null;
 setup(renderHome(data,CHARACTERS,{lang,progress:p,last}),'home',false);
}
function start(newMode){
 if(!['speed','precise'].includes(newMode))throw Error(tr('invalidTest'));
 const p=progress();mode=newMode;if(p){showResume(p);return;}begin(newMode,[]);
}
function begin(newMode,values){modal.close();clearTimeout(revealTimer);navigationVersion++;mode=newMode;answers=[...values];locked=false;history.pushState(null,'','#test/'+mode);question();}
function showResume(p){
 modal.removeAttribute('aria-labelledby');modal.setAttribute('aria-label',tr('resumeLabel'));
 modal.innerHTML='<form method="dialog"><button class="icon-button modal-close" aria-label="'+tx('close')+'">'+icon('close')+'</button></form>'+char('INTP','wow')+'<h2>'+lines('resumeTitle')+'</h2><p>'+lines('resumeBody',{mode:modeTitle(p.mode),count:p.answers.length})+'</p><button class="primary full" data-action="resume">'+tx('continue')+'</button><button class="ghost full" data-action="restart">'+tx(p.mode===mode?'restart':mode==='precise'?'startPrecise':'startSpeed')+'</button>';modal.showModal();
}
function question(){
 const qs=data.questions[mode],i=answers.length,q=qs[i];if(!q)return;const t=data.types[q.speaker];
 setup('<header class="test-header"><button class="icon-button" aria-label="'+tx('closeTest')+'" data-action="home">'+icon('close')+'</button><div class="progress-track" role="progressbar" aria-label="'+tx('testProgress')+'" aria-valuemin="0" aria-valuemax="'+qs.length+'" aria-valuenow="'+i+'"><span style="width:'+Math.max(4,i/qs.length*100)+'%"></span>'+char('ENFP','happy','progress-character')+'</div><span class="counter">'+(i+1)+'/'+qs.length+'</span></header>'+
 '<section class="question-content" data-question-index="'+i+'"><div class="question-card" style="--family-soft:'+t.familySoft+';--family-deep:'+t.familyDeep+'"><span class="pill">Q'+(i+1)+' · '+esc(q.badge)+'</span>'+char(q.speaker,q.speakerMood)+'<p class="quote">'+nl(q.quote)+'</p><h1>'+nl(q.text)+'</h1></div>'+
 '<div class="answers"><button class="option" data-choice="0" data-index="'+i+'"><span class="letter">A</span><span>'+esc(q.optionA)+'</span></button><button class="option" data-choice="1" data-index="'+i+'"><span class="letter">B</span><span>'+esc(q.optionB)+'</span></button></div></section>'+
 '<p class="save-note">'+tx(storageWorks?'saveNote':'saveUnavailable')+'</p>','test');
 app.querySelector('.progress-character').style.left=Math.max(4,i/qs.length*100)+'%';
}
async function choose(choice,expectedIndex=answers.length){
 if(view!=='test'||locked||languageBusy||expectedIndex!==answers.length||![0,1].includes(choice))throw Error(tr('answerUnavailable'));
 const version=navigationVersion;locked=true;answers.push(choice);
 app.querySelectorAll('[data-choice]').forEach(b=>{b.disabled=true;if(Number(b.dataset.choice)===choice)b.classList.add('selected');});
 const done=answers.length===data.questions[mode].length;
 if(done){result={...score(data.questions[mode],answers),mode};write('result',result);write('progress',null);history.replaceState(null,'',encodeResult(result));}
 else write('progress',{mode,answers});
 await new Promise(resolve=>setTimeout(resolve,260));
 if(view!=='test'||version!==navigationVersion)return state();
 if(done){locked=false;reveal();}else{question();await new Promise(resolve=>setTimeout(resolve,320));if(version===navigationVersion)locked=false;}
 return state();
}
function reveal(){
 history.replaceState(null,'',encodeResult(result));
 setup('<button class="ghost skip" data-action="result">'+tx('skip')+'</button><div class="reveal-center">'+char(result.type,'wow','reveal-character')+'<h1>'+tx('revealTitle')+'</h1><p>'+tx('revealBody')+'</p></div><button class="ghost reveal-skip" data-action="result">'+tx('revealSkip')+'</button>','reveal');
 revealTimer=setTimeout(()=>renderResult(result),1800);
}
function gauge(left,right,pct,color,deep){
 const isLeft=pct>=50,percent=isLeft?pct:100-pct;
 return '<div class="gauge" style="--gauge:'+color+';--gauge-deep:'+deep+'"><span class="pole '+(isLeft?'active':'')+'">'+left+'</span><div class="gauge-track" role="img" aria-label="'+(isLeft?left:right)+' '+percent+'%"><i style="width:'+percent+'%;'+(isLeft?'left:0':'right:0')+'"></i></div><span class="pole '+(!isLeft?'active':'')+'">'+right+'</span><b>'+percent+'%</b></div>';
}
function renderResult(r){
 if(!r||!data.types[r.type]){home();return;}clearTimeout(revealTimer);result=r;const t=data.types[r.type];
 document.title=tr('resultPageTitle',{type:r.type,name:t.dexName});
 setup('<header class="result-header"><button class="icon-button" aria-label="'+tx('home')+'" data-action="home">'+icon('back')+'</button><button class="share-pill" data-action="share">'+icon('share')+' '+tx('share')+'</button></header>'+
 '<section class="result-hero" style="--type-deep:'+t.deep+'"><div class="character-stage">'+char(r.type,'happy','result-character')+'<i class="confetti one"></i><i class="confetti two"></i><i class="confetti three"></i></div><span class="result-badge">'+tx('resultIntro')+'</span><div class="type-code">'+r.type+'</div><h1>'+esc(t.nickname)+'</h1><p class="quote">“'+esc(t.tagline)+'”</p></section>'+
 '<section class="soft-card"><h2>'+tx('dimensions')+'</h2>'+gauge('E','I',r.e,'#FFB199','#C77155')+gauge('S','N',100-r.n,'#C3B1EF','#8E7CC9')+gauge('T','F',100-r.f,'#A5DFC0','#4B9673')+gauge('J','P',100-r.p,'#FFD97A','#A17B2C')+
 (r.mode==='speed'?'<p class="fineprint gauge-note">'+tx('gaugeNote')+'</p>':'')+'</section>'+
 '<section class="soft-card"><h2>'+tx('aboutType')+'</h2><p>'+esc(t.summary)+'</p></section>'+
 '<section class="mini-grid" aria-label="'+tx('personalityDetails')+'"><article class="mini-info love"><h2>'+tx('love')+'</h2><p>'+esc(t.love)+'</p></article><article class="mini-info friend"><h2>'+tx('friendship')+'</h2><p>'+esc(t.friend)+'</p></article><article class="mini-info work"><h2>'+tx('work')+'</h2><p>'+esc(t.work)+'</p></article></section>'+
 '<section class="match-grid" aria-label="'+tx('matchDetails')+'">'+match(tr('bestMatch'),t.bestMatch,t.bestMatchNote,'good')+match(tr('chaosMatch'),t.worstMatch,t.worstMatchNote,'bad')+'</section>'+
 '<section class="soft-card memes"><h2>'+tx('frequentSayings',{type:r.type})+'</h2>'+t.memes.map(m=>'<p class="speech">'+esc(m.text)+(m.sub?'<small> '+esc(m.sub)+'</small>':'')+'</p>').join('')+'</section>'+
 '<div class="result-actions"><button class="primary full" data-action="share">'+tx('shareResult')+'</button>'+(r.mode==='speed'?'<button class="soft-button full" data-start="precise">'+tx('preciseCta')+'</button>':'')+'<button class="ghost full" data-action="home">'+tx('retake')+'</button><p class="fineprint">'+tx('disclaimer')+'</p></div>','result');
}
function match(title,type,note,cls){return '<article class="match-card '+cls+'"><h2>'+esc(title)+'</h2>'+char(type)+'<strong>'+type+'</strong><p>'+esc(note)+'</p></article>';}
function shareURL(){const url=new URL(PAGE_PATHS[lang],location.origin);url.hash=encodeResult(result);return url.href;}
function shareDialog(){
 if(!result)return;const t=data.types[result.type];
 modal.innerHTML='<form method="dialog"><button class="icon-button modal-close" aria-label="'+tx('close')+'">'+icon('close')+'</button></form><h2 id="share-title">'+tx('shareTitle')+'</h2><div class="share-preview" style="--family-soft:'+t.familySoft+';--type-deep:'+t.deep+'">'+char(result.type)+'<strong>'+result.type+'</strong><h3>'+esc(t.nickname)+'</h3><p class="quote">“'+esc(t.tagline)+'”</p></div><button class="primary full" data-action="native-share">'+icon('share')+' '+tx('shareAction')+'</button><div class="share-tools"><button class="soft-button" data-action="copy">'+icon('link')+' '+tx('copyLink')+'</button><button class="soft-button" data-action="download">'+icon('download')+' '+tx('saveImage')+'</button></div><p class="fineprint">'+tx('sharedLinkNote')+'</p><label class="copy-fallback" hidden>'+tx('resultLink')+'<input readonly aria-label="'+tx('resultLinkLabel')+'" value="'+esc(shareURL())+'"></label>';
 modal.removeAttribute('aria-label');modal.setAttribute('aria-labelledby','share-title');modal.showModal();
}
async function copyLink(){
 const url=shareURL();try{await navigator.clipboard.writeText(url);toast(tr('copied'));}
 catch{const fallback=modal.querySelector('.copy-fallback');if(fallback){fallback.hidden=false;fallback.querySelector('input').select();}toast(tr('copyFallback'));}
}
async function nativeShare(){
 const t=data.types[result.type],payload={title:tr('nativeShareTitle',{type:result.type,name:t.dexName}),text:tr('nativeShareText',{name:t.nickname}),url:shareURL()};
 if(navigator.share){try{await navigator.share(payload);}catch(e){if(e.name!=='AbortError')await copyLink();}}else await copyLink();
}
async function downloadCard(){
 const card={...result},content=data.types[card.type],ui={...data.ui},cardLang=lang;
 const button=modal.querySelector('[data-action="download"]');button.disabled=true;button.textContent=ui.preparingImage;
 let imageURL;
 try{
  const brandFont=['ja','zh','zh-Hant','vi'].includes(cardLang)?'Pretendard':'Cafe';
  const quoteFont=['ja','zh','zh-Hant','vi'].includes(cardLang)?'Pretendard':'Gaegu';
  await document.fonts.ready;await document.fonts.load('44px '+brandFont,content.nickname);await document.fonts.load('38px '+quoteFont,content.tagline);
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');
  c.fillStyle='#FFF9F1';c.fillRect(0,0,1080,1350);c.fillStyle=content.familySoft;c.beginPath();c.roundRect(60,60,960,1230,64);c.fill();
  c.textAlign='center';c.fillStyle='#4B4358';fitText(c,ui.resultIntro,540,152,850,38,brandFont);
  const img=new Image();imageURL=URL.createObjectURL(new Blob([CHARACTERS[card.type+'-happy']],{type:'image/svg+xml'}));img.src=imageURL;await img.decode();c.drawImage(img,320,200,440,440);
  c.fillStyle=content.deep;c.font='96px '+brandFont+',system-ui,sans-serif';c.fillText(card.type,540,748);
  c.fillStyle='#4B4358';fitText(c,content.nickname,540,830,880,44,brandFont);
  c.fillStyle='#81778E';c.font='36px '+quoteFont+',system-ui,sans-serif';wrapCanvas(c,'“'+content.tagline+'”',540,903,830,46,3);
  const labels=[['E','I',card.e],['S','N',100-card.n],['T','F',100-card.f],['J','P',100-card.p]];
  c.font='32px '+brandFont+',system-ui,sans-serif';labels.forEach(([a,b,p],i)=>{const x=215+i*216;c.fillStyle='#fff';c.beginPath();c.roundRect(x-85,1060,170,100,26);c.fill();c.fillStyle=content.deep;c.fillText((p>=50?a:b)+' '+Math.max(p,100-p)+'%',x,1123);});
  c.fillStyle='#4B4358';c.font='40px '+brandFont+',system-ui,sans-serif';c.fillText(ui.brand,540,1230);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('empty');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Mongle-'+card.type+'-'+cardLang+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast(ui.imageSaved);
 }catch{toast(ui.imageSaveError);}finally{if(imageURL)URL.revokeObjectURL(imageURL);button.disabled=false;button.innerHTML=icon('download')+' '+esc(ui.saveImage);}
}
function fitText(c,text,x,y,width,size,font){do{c.font=size+'px '+font+',system-ui,sans-serif';size--;}while(c.measureText(text).width>width&&size>22);c.fillText(text,x,y,width);}
function wrapCanvas(c,text,x,y,maxWidth,lineHeight,maxLines){
 let line='',lines=0;for(const ch of text){if(c.measureText(line+ch).width>maxWidth){if(lines===maxLines-1){c.fillText(line+'…',x,y,maxWidth);return;}c.fillText(line,x,y);line=ch;y+=lineHeight;lines++;}else line+=ch;}if(line)c.fillText(line,x,y);
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled||!data||languageBusy)return;
 if(b.dataset.start)return start(b.dataset.start);
 if(b.dataset.choice!==undefined){choose(Number(b.dataset.choice),Number(b.dataset.index)).catch(()=>{});return;}
 switch(b.dataset.action){
 case'home':goHome();break;
 case'resume':{const p=progress();if(p)begin(p.mode,p.answers);break;}
 case'restart':write('progress',null);begin(mode,[]);break;
 case'last':{const r=read('result');if(r){history.pushState(null,'',encodeResult(r));renderResult(decodeResult(encodeResult(r)));}break;}
 case'result':renderResult(result);break;
 case'share':shareDialog();break;
 case'copy':copyLink();break;
 case'native-share':nativeShare();break;
 case'download':downloadCard();break;
 }
});
document.addEventListener('keydown',e=>{
 if(modal.open||languageBusy||e.repeat||e.metaKey||e.ctrlKey||e.altKey||['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(e.target.tagName))return;
 if(view==='test'&&!locked&&['a','b','1','2'].includes(e.key.toLowerCase())){e.preventDefault();choose(['a','1'].includes(e.key.toLowerCase())?0:1).catch(()=>{});}
 if(e.key==='Escape'&&view==='test')goHome();
 if(view==='reveal'&&['Enter',' ','Escape'].includes(e.key)){e.preventDefault();renderResult(result);}
});
window.addEventListener('popstate',()=>{if(data&&!languageBusy){const next=preferredLocale();next===lang?route():setLanguage(next);}});
function route(){
 navigationVersion++;clearTimeout(revealTimer);locked=false;if(modal.open)modal.close();
 const shared=decodeResult(location.hash);if(shared){renderResult(shared);return;}
 if(/^#test\/(speed|precise)$/.test(location.hash)){mode=location.hash.split('/')[1];const p=progress();answers=p?.mode===mode?[...p.answers]:[];question();return;}
 if(location.hash.startsWith('#result/')){home();toast(tr('invalidResult'));return;}home();
}
function normalizeLocale(value){
 const tag=String(value||'').toLowerCase();
 if(tag==='zh-hant'||/^zh-(tw|hk|mo)/.test(tag))return 'zh-Hant';
 if(tag.startsWith('zh'))return 'zh';const prefix=tag.split('-')[0];return Object.hasOwn(LANGUAGES,prefix)?prefix:'en';
}
function preferredLocale(){return normalizeLocale(new URLSearchParams(location.search).get('lang')||Object.keys(PAGE_PATHS).find(key=>PAGE_PATHS[key]===location.pathname.replace(/index\.html$/,''))||'en');}
async function setLanguage(target,initial=false){
 if(languageBusy)return;const next=normalizeLocale(target);const current={view,mode,answers:[...answers],hash:location.hash};languageBusy=true;selector.disabled=true;
 const restore=()=>{if(current.view==='test'&&current.hash===location.hash&&current.answers.length<data.questions[current.mode].length){mode=current.mode;answers=current.answers;locked=false;if(modal.open)modal.close();question();}else route();};
 // Accepted answers are already saved; route() resumes at the next question after loading.
 navigationVersion++;clearTimeout(revealTimer);
 try{
  let pack=localeCache.get(next);
  if(!pack){const response=await fetch(LOCALE_URLS[next]);if(!response.ok)throw Error('locale');pack=await response.json();localeCache.set(next,pack);}
  data=pack;lang=next;write('language',lang);selector.value=lang;
  document.documentElement.lang=htmlLang(lang);
  document.documentElement.dataset.brandFont=['ja','zh','zh-Hant','vi'].includes(lang)?'system':'brand';
  document.querySelector('#language-label').textContent=tr('language');selector.setAttribute('aria-label',tr('language'));
  document.querySelector('#back-to-mongle').href=landingPath(lang);
  const url=new URL(location.href);url.pathname=PAGE_PATHS[lang];url.searchParams.delete('lang');history.replaceState(null,'',url);
  const canonical=location.origin+PAGE_PATHS[lang];
  document.querySelector('link[rel="canonical"]').href=canonical;
  for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])document.querySelector(selector).content=data.seo.description;
  for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])document.querySelector(selector).content=data.seo.title;
  document.querySelector('meta[property="og:url"]').content=canonical;
  document.querySelector('meta[property="og:locale"]').content=data.seo.ogLocale;
  for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])document.querySelector(selector).content=data.seo.image;
  document.querySelector('#page-schema').textContent=JSON.stringify(data.schema);
  document.title=data.seo.title;
  languageBusy=false;restore();
 }catch{
  if(data){selector.value=lang;toast(tr('languageError'));languageBusy=false;restore();}
  else{const error=document.querySelector('#boot-error');if(error)error.hidden=false;}
 }finally{languageBusy=false;selector.disabled=false;}
}
selector.innerHTML=Object.entries(LANGUAGES).map(([value,name])=>'<option value="'+value+'">'+name+'</option>').join('');
selector.addEventListener('change',()=>setLanguage(selector.value));
function state(){return {view,language:lang,mode,...(view==='test'?{question:answers.length+1,total:data.questions[mode].length,prompt:data.questions[mode][answers.length]?.text,options:[data.questions[mode][answers.length]?.optionA,data.questions[mode][answers.length]?.optionB]}:{}),...(view==='result'||view==='reveal'?{result}:{})};}
function webTools(){
 const ctx=document.modelContext;if(!ctx?.registerTool)return;
 const controller=new AbortController();
 const tool=(name,description,inputSchema,execute,readOnlyHint=false)=>{try{Promise.resolve(ctx.registerTool({name,description,inputSchema,execute:async input=>{try{return await execute(input);}catch(error){return {error:error.message,state:state()};}},annotations:{readOnlyHint,untrustedContentHint:false}},{signal:controller.signal})).catch(()=>{});}catch{}};
 tool('mongle_get_state','Read the current personality test question or result.',{type:'object',properties:{},additionalProperties:false},()=>state(),true);
 tool('mongle_start_test','Start a personality test without overwriting saved progress.',{type:'object',properties:{mode:{type:'string',enum:['speed','precise']}},required:['mode'],additionalProperties:false},input=>{if(!input||!['speed','precise'].includes(input.mode))throw Error(tr('invalidTest'));if(progress()||(view==='test'&&answers.length>0))throw Error(tr('testInProgress'));begin(input.mode,[]);return state();});
 tool('mongle_answer_question','Choose A or B for the current question. The final answer computes the result.',{type:'object',properties:{question:{type:'integer',minimum:1},choice:{type:'string',enum:['A','B']}},required:['question','choice'],additionalProperties:false},async input=>{if(!input||!Number.isInteger(input.question)||!['A','B'].includes(input.choice))throw Error(tr('invalidAnswer'));return choose(input.choice==='A'?0:1,input.question-1);});
 window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
await setLanguage(preferredLocale(),true);if(data)webTools();
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/mongle/play/sw.js',{scope:'/mongle/play/',updateViaCache:'none'}).catch(()=>{}),{once:true});if(document.readyState==='complete')navigator.serviceWorker.register('/mongle/play/sw.js',{scope:'/mongle/play/',updateViaCache:'none'}).catch(()=>{});}
