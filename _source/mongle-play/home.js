// One renderer for the static HTML and the interactive home screen.
export const LANGUAGES={ko:'한국어',en:'English',ja:'日本語',zh:'简体中文','zh-Hant':'繁體中文',es:'Español',fr:'Français',de:'Deutsch',pt:'Português',id:'Bahasa Indonesia',vi:'Tiếng Việt'};
export const PAGE_PATHS=Object.fromEntries(Object.keys(LANGUAGES).map(lang=>[lang,'/mongle/play/'+(lang==='en'?'':lang+'/')]));
export const ABOUT_PATHS=Object.fromEntries(Object.entries(PAGE_PATHS).map(([lang,path])=>[lang,path+'about/']));
export const htmlLang=lang=>lang==='zh'?'zh-Hans':lang;
export const landingPath=lang=>'/'+htmlLang(lang)+'/mongle/';
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderHome(data,characters,{lang='en',progress=null,last=null}={}){
 const esc=escapeHTML,ui=data.ui,seo=data.seo;
 const tx=(key,args={})=>esc(ui[key].replace(/\{(\w+)\}/g,(_,k)=>String(args[k]??'')));
 const lines=key=>tx(key).replace(/\n/g,'<br>');
 const char=(type,mood='happy',cls='')=>'<span class="character '+cls+'" role="img" aria-label="'+tx('characterAlt',{type})+'">'+characters[type+'-'+mood]+'</span>';
 return '<header class="home-header"><span class="wordmark">'+tx('brand')+'<span class="wordmark-dot">.</span></span><span class="small">'+tx('playground')+'</span></header>'+
 '<section class="home-intro"><div><h1><span class="home-keyword">'+esc(seo.eyebrow)+'</span>'+lines('homeTitle')+'</h1><p>'+tx('homeSubtitle')+'</p></div>'+char('ENFP','happy','home-mascot')+'</section>'+
 '<section class="test-menu" aria-label="'+tx('testSelection')+'"><article class="mode-card detailed"><div class="mode-copy"><span class="pill">'+tx('preciseMeta')+'</span><h2>'+tx('preciseTitle')+'</h2><p>'+lines('preciseDescription')+'</p><button class="primary purple" data-start="precise">'+tx('start')+'</button></div>'+char('INTJ','calm','mode-mascot')+'</article>'+
 '<button class="speed-card" data-start="speed"><span class="speed-icon" aria-hidden="true">ϟ</span><span><strong>'+tx('speedTitle')+'</strong><small>'+tx('speedMeta')+'</small></span>'+char('ESFP','happy','speed-mascot')+'</button></section>'+
 (progress?'<button class="resume-row" data-action="resume"><span>'+tx('resumeTest')+'</span><span>'+progress.answers.length+' / '+data.questions[progress.mode].length+'</span></button>':'')+
 (last?'<button class="last-result" data-action="last">'+char(last.type)+'<span>'+tx('lastResult')+'<strong>'+last.type+' · '+esc(data.types[last.type].dexName)+'</strong></span></button>':'')+
 '<p class="privacy-note">'+tx('privacyNote')+'</p><p class="fineprint">'+tx('disclaimer')+'</p>'+
 '<a class="guide-link" href="'+ABOUT_PATHS[lang]+'">'+esc(seo.introTitle)+' →</a>';}
// 테스트 소개(검색용 설명)는 첫 화면의 시선을 뺏지 않도록 /about/ 별도 페이지에 둔다.
export function renderAbout(data,{lang='en'}={}){
 const esc=escapeHTML,seo=data.seo;
 return '<section class="test-guide about-guide"><h1>'+esc(seo.introTitle)+'</h1><p>'+esc(seo.introText)+'</p>'+seo.details.map(d=>'<h2>'+esc(d.title)+'</h2><p>'+esc(d.text)+'</p>').join('')+
 '<a class="primary full about-start" href="'+PAGE_PATHS[lang]+'#test/speed">'+esc(data.ui.startSpeed)+'</a><a class="about-more" href="'+landingPath(lang)+'">'+esc(seo.learnMore)+' →</a></section>';
}
