#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reapply public-site SEO after app exports. No network calls; sources live beside this file."""
from pathlib import Path
from itertools import combinations_with_replacement
from urllib.parse import urljoin, urlsplit
from html import escape
import argparse, json, re, xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from favicons import apply as apply_favicons

HERE = Path(__file__).resolve().parent
BASE = 'https://h1soft.github.io'
ALIASES = {'/mongle/': '/en/mongle/', '/seukscan/': '/en/seukscan/', '/sudoku/': '/ko/sudoku/'}
APP_TYPES = {'SoftwareApplication', 'MobileApplication', 'WebApplication'}
SKIP = {'privacy', 'terms', 'legal', 'delete', 'admin', 'identity', 'share', 'review', 'metrics', 'analytics-privacy'}

def soup(text):
    return BeautifulSoup(text, 'html.parser')

def url_for(path, root):
    rel = path.relative_to(root).as_posix()
    return BASE + '/' + (rel[:-10] if rel.endswith('index.html') else rel)

def meta(text, name, value, prop=False):
    attr = 'property' if prop else 'name'
    tag = f'<meta {attr}="{escape(name)}" content="{escape(value, quote=True)}">'
    pattern = rf'<meta\b(?=[^>]*\b{attr}=[\"\']{re.escape(name)}[\"\'])[^>]*>'
    if re.search(pattern, text, re.I):
        return re.sub(pattern, lambda m: tag, text, flags=re.I)
    return text.replace('</head>', tag + '\n</head>', 1)

def block(text, name, content, before='</main>'):
    start, end = f'<!-- seo:{name} -->', f'<!-- /seo:{name} -->'
    rendered = start + '\n' + content + '\n' + end
    pattern = re.escape(start) + r'[\s\S]*?' + re.escape(end)
    if start in text:
        return re.sub(pattern, lambda m: rendered, text)
    assert before in text, (name, before)
    return text.replace(before, rendered + '\n' + before, 1)

def schema_block(text, obj):
    encoded = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    return block(text, 'structured-data', '<script type="application/ld+json">' + encoded + '</script>', '</head>')

def description(text, value):
    for name, prop in [('description', False), ('og:description', True), ('twitter:description', False)]:
        text = meta(text, name, value, prop)
    return text

def write(path, text, changed):
    if not path.exists() or path.read_text() != text:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        changed.add(path)

def document_schema(text, url, page_type='WebPage'):
    doc = soup(text); title = doc.title.get_text(' ', strip=True)
    desc = doc.select_one('meta[name="description"]')['content']
    trail = [{'@type':'ListItem', 'position':1, 'name':'애착인형 뽑기', 'item':BASE+'/attachment/'}]
    if '/pair/' in url and url != BASE+'/attachment/pair/':
        trail.append({'@type':'ListItem','position':2,'name':'궁합 찾아보기','item':BASE+'/attachment/pair/'})
    trail.append({'@type':'ListItem', 'position':len(trail)+1, 'name':title, 'item':url})
    return {'@context':'https://schema.org','@graph':[
        {'@type':page_type,'@id':url+'#webpage','url':url,'name':title,'description':desc,'inLanguage':'ko',
         'publisher':{'@type':'Organization','name':'H1Soft','url':BASE+'/'}},
        {'@type':'BreadcrumbList','itemListElement':trail}]}

def attachment(root, changed):
    types = json.loads((HERE/'attachment-types.json').read_text())
    # Character copy is the approved app content, not an invented compatibility score.
    for a, b in combinations_with_replacement(sorted(types, key=lambda t:t['slug']), 2):
        slug = a['slug']+'-'+b['slug']; path=root/'attachment/pair'/slug/'index.html'
        text=path.read_text(); same=a['slug']==b['slug']
        desc = (f"{a['name']}끼리 만났을 때의 궁합. {a['nick']} 두 인형이 서로에게 바라는 말과, 같은 습관이 겹칠 때의 대화 방법을 알아보세요." if same else
                f"{a['name']}와 {b['name']}의 궁합. ‘{a['nick']}’ 성향과 ‘{b['nick']}’ 성향이 만났을 때의 장점, 서운한 순간, 서로를 위한 대화 방법을 살펴보세요.")
        text=description(text,desc)
        text=re.sub(r'<p class="intro">[\s\S]*?</p>',lambda m:'<p class="intro">'+escape(desc)+'</p>',text,count=1)
        if same:
            content=f'''<section id="pair-guide"><h2>같은 {escape(a['name'])}, 서로 다른 하루</h2>
<p>{escape(a['intro'])}</p><p>둘 다 이 모습에 공감하더라도 오늘 필요한 배려까지 같지는 않아요. 한 사람은 “{escape(a['triggers'][0])}” 같은 순간에 서운하고, 다른 사람은 “{escape(a['triggers'][-1])}” 같은 순간에 마음이 흔들릴 수 있어요.</p>
<h3>같은 습관이 겹칠 때</h3><p>‘{escape(a['nick'])}’ 두 인형이 동시에 마음이 흔들리면 누가 먼저 알아줘야 하는지 기다리기 쉬워요. 먼저 말할 사람과 들어줄 사람을 정한 뒤, 역할을 바꿔 서로의 하루를 나눠 보세요.</p>
<h3>오늘 하나만 같이 해보기</h3><p>{escape(a['care'][0]['text'])} 그다음 각자 “{escape(a['quote'])}”라는 말이 편하게 나오는 순간을 하나씩 이야기해 보세요.</p><p>{escape(a['tip'])}</p></section>'''
        else:
            content='<section id="pair-guide"><h2>두 인형의 리듬을 맞춰 보기</h2>'
            for person,other in [(a,b),(b,a)]:
                content+=f'''<h3>{escape(other['name'])}에게 전하는 {escape(person['name'])}의 마음</h3>
<p>{escape(person['intro'])}</p><p>“{escape(person['quote'])}”라는 캐릭터의 말에 공감하나요? ‘{escape(other['nick'])}’ 상대에게 이 말이 떠오르는 때와 그때 바라는 도움을 따로 설명해 보세요.</p>
<p>서로의 차이를 알아차리고 싶다면 “{escape(person['triggers'][0])}” 같은 순간과 “{escape(other['triggers'][0])}” 같은 순간을 하나씩 골라 이야기해 보세요. 상대도 나와 같은 장면에서 서운할 거라고 짐작하지 않아도 돼요.</p>
<p><strong>상대가 해 줄 수 있는 작은 배려:</strong> {escape(person['care'][0]['text']).rstrip(".!?")}. {escape(person['care'][-1]['text']).rstrip(".!?")}.</p>'''
            content+='</section>'
        text=block(text,'pair-guide',content)
        links=''.join(f'<li><a href="/attachment/t/{t["slug"]}/#compatibility">{escape(t["name"])}의 다른 궁합</a></li>' for t in ([a] if same else [a,b]))
        text=block(text,'related-pairs','<nav class="pair-nav" aria-label="다른 궁합"><h2>다른 조합도 궁금한가요?</h2><ul>'+links+'</ul><a href="/attachment/pair/">모든 인형의 궁합 찾아보기 →</a></nav>')
        text=schema_block(text,document_schema(text,url_for(path,root)))
        write(path,text,changed)
    for t in types:
        path=root/'attachment/t'/t['slug']/'index.html';text=path.read_text()
        links=[]
        for other in types:
            slug='-'.join(sorted([t['slug'],other['slug']]))
            links.append(f'<li><a href="/attachment/pair/{slug}/">{escape(t["name"])} × {escape(other["name"])}</a></li>')
        content='<section id="compatibility" class="compatibility-links"><h2>'+escape(t['name'])+'의 궁합 찾아보기</h2><p>어떤 인형과 함께하나요? 조합별 장점과 대화 방법을 살펴보세요.</p><ul>'+''.join(links)+'</ul><a href="/attachment/pair/">다른 인형의 궁합도 보기 →</a></section>'
        text=block(text,'compatibility',content);text=schema_block(text,document_schema(text,url_for(path,root)))
        write(path,text,changed)
        # Invitations are share flows, not independent search landing pages.
        path=root/'attachment/with'/t['slug']/'index.html';text=path.read_text();title=t['name']+'의 궁합 초대'
        text=re.sub(r'<title>[\s\S]*?</title>',lambda m:'<title>'+escape(title)+' | 애착인형 뽑기</title>',text,count=1)
        text=re.sub(r'<h1>[\s\S]*?</h1>',lambda m:'<h1>'+escape(title)+'</h1>',text,count=1)
        text=meta(text,'og:title',title,True);text=meta(text,'twitter:title',title);text=meta(text,'robots','noindex,follow')
        text=schema_block(text,document_schema(text,url_for(path,root)))
        write(path,text,changed)
    path=root/'attachment/pair/index.html'
    links=''.join(f'<li><a href="/attachment/t/{t["slug"]}/#compatibility"><strong>{escape(t["name"])}</strong><span>{escape(t["nick"])}</span></a></li>' for t in types)
    text='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>애착인형 궁합 찾기 — 17종 인형, 153가지 조합</title><meta name="description" content="안정형·불안형·회피형·혼란형과 시크릿 인형까지. 내 인형을 골라 153가지 궁합의 장점과 대화 방법을 살펴보세요."><link rel="canonical" href="https://h1soft.github.io/attachment/pair/"><link rel="stylesheet" href="/attachment/discovery.css"><link rel="icon" href="/attachment/assets/app-icon.png"><meta property="og:type" content="website"><meta property="og:url" content="https://h1soft.github.io/attachment/pair/"><meta property="og:image" content="https://h1soft.github.io/attachment/assets/og-promo.jpg"><meta name="twitter:card" content="summary_large_image"><script defer src="/js/analytics.js?v=services-20260930"></script></head><body><header><a href="/attachment/">애착인형 뽑기</a><a href="/attachment/play/">내 인형 뽑기 →</a></header><main><h1>우리 인형은 어떤 궁합일까?</h1><p class="intro">먼저 내 인형을 골라 주세요. 17종 인형의 153가지 조합에서 잘 맞는 순간과 서로에게 필요한 배려를 찾아볼 수 있어요.</p><ul class="compatibility-index">'''+links+'''</ul><p class="notice">유형을 빗댄 재미있는 대화 가이드예요. 개인 궁합 점수는 같은 모드의 두 테스트 결과로 확인할 수 있어요.</p><a class="cta" href="/attachment/play/">나는 어떤 인형인지 알아보기 →</a></main><footer><a href="/attachment/">애착인형 뽑기 홈</a><a href="/attachment/about/">애착유형 소개</a><a href="/attachment/support/">문의</a><a href="/">H1Soft</a></footer></body></html>'''
    text=schema_block(text,document_schema(text,url_for(path,root),'CollectionPage'))
    text=meta(text,'og:title','애착인형 궁합 찾기 — 153가지 조합',True)
    text=description(text,'내 인형을 골라 153가지 궁합의 장점과 대화 방법을 살펴보세요. 안정형·불안형·회피형·혼란형과 시크릿 인형까지 만나 보세요.')
    write(path,text,changed)
    path=root/'attachment/index.html';text=path.read_text()
    content='<p class="compatibility-hub-link"><a class="button secondary" href="/attachment/pair/">인형별 궁합 찾아보기 →</a></p>'
    # Put the link inside the existing compatibility section, near its content.
    match=re.search(r'<section\b[^>]*id="compat"[\s\S]*?</section>',text)
    if match:
        old=match[0];new=block(old,'pair-index',content,'</section>');text=text[:match.start()]+new+text[match.end():]
    write(path,text,changed)
    path=root/'attachment/about/index.html';text=path.read_text()
    text=description(text,'애착인형 뽑기의 불안·회피 게이지와 안정형·불안형·회피형·혼란형을 알아보세요. 16종과 시크릿 인형이 정해지는 방식, 관계를 돌아보는 대화의 시작을 소개합니다.')
    text=schema_block(text,document_schema(text,url_for(path,root),'AboutPage'));write(path,text,changed)
    for rel in ['attachment/go/index.html','attachment/play/index.html']:
        path=root/rel;text=meta(path.read_text(),'robots','noindex,follow');write(path,text,changed)
    css='''\n/* SEO discovery links reuse the existing page typography and palette. */
.compatibility-links{margin:48px 0}.compatibility-links ul,.compatibility-index{list-style:none;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px}.compatibility-links li,.compatibility-index li{margin:0;border-bottom:1px solid #EADFD6}.compatibility-links a,.compatibility-index a{display:block;padding:14px 0;min-height:44px}.compatibility-index a{text-decoration:none}.compatibility-index span{display:block;font-size:14px;color:#5E505A}.pair-nav{margin:40px 0}.pair-nav a{display:inline-block;padding:8px 0}.compatibility-hub-link{margin-top:24px}#pair-guide p{max-width:65ch}.compatibility-index a:hover strong{text-decoration:underline;text-underline-offset:5px}@media(max-width:600px){.compatibility-links ul,.compatibility-index{grid-template-columns:1fr}}\n'''
    for rel in ['attachment/styles.css','attachment/discovery.css']:
        path=root/rel;text=path.read_text();marker='/* SEO discovery links'
        if marker in text:text=text[:text.index(marker)].rstrip()+'\n'
        write(path,text.rstrip()+css,changed)

def public_pages(root):
    for path in sorted(root.rglob('*.html')):
        rel=path.relative_to(root)
        if any(part.startswith('.') or part in {'_source','node_modules','tools'} for part in rel.parts):continue
        if any(part in SKIP for part in rel.parts) or path.name in {'privacy.html','404.html'}:continue
        yield path

def enrich_pages(root,changed):
    catalog=json.loads((HERE/'store-facts.json').read_text())
    facts=catalog['apps']
    for path in public_pages(root):
        text=path.read_text();text=re.sub(r'<a\b(?=[^>]*\bhref=["\'][^"\']*/(?:skinping|lol[.]dating)(?:/|["\']))[^>]*>[\s\S]*?</a>', '', text, flags=re.I);doc=soup(text);url=url_for(path,root);lang=doc.html.get('lang','en');rel=path.relative_to(root)
        canon=doc.select_one('link[rel="canonical"]');canonical=canon['href'] if canon else url
        title=doc.title.get_text(' ',strip=True) if doc.title else ''
        desc=doc.select_one('meta[name="description"]');desc=desc.get('content','') if desc else ''
        # All support pages get a truthful preview from their own localized copy.
        if 'support' in rel.parts:
            parent=path.parent.parent/'index.html';parentdoc=soup(parent.read_text()) if parent.exists() else None
            image=parentdoc.select_one('meta[property="og:image"]') if parentdoc else None
            for name,value,prop in [('og:title',title,True),('og:description',desc,True),('og:url',canonical,True),('og:type','website',True),('og:image',image['content'] if image else BASE+'/assets/og-h1soft-en.png',True),('twitter:card','summary_large_image',False),('twitter:title',title,False),('twitter:description',desc,False),('twitter:image',image['content'] if image else BASE+'/assets/og-h1soft-en.png',False)]:text=meta(text,name,value,prop)
        # Normalize only links that point to duplicate root aliases; preserve query/fragment.
        def link(m):
            tag=soup(m[0]).a;old=tag.get('href') if tag else None
            if not old:return m[0]
            target=urlsplit(urljoin(url,old));route=target.path
            if route.endswith('index.html'):route=route[:-10]
            if target.netloc!='h1soft.github.io' or route not in ALIASES:return m[0]
            app=route.strip('/');locale=lang.split('-')[0]
            candidate=root/locale/app/'index.html'
            route=f'/{locale}/{app}/' if candidate.exists() else ALIASES[route]
            new=route+('?' + target.query if target.query else '')+('#'+target.fragment if target.fragment else '')
            return re.sub(r'\bhref=([\"\'])(.*?)\1',lambda _:f'href="{escape(new,quote=True)}"',m[0],count=1)
        text=re.sub(r'<a\b[^>]*>',link,text)
        product=next((key for key in facts if key in rel.parts),None)
        if product=='cleaner' and 'support' not in rel.parts:
            copy_lang={'zh-Hans':'zh-CN','zh-Hant':'zh-TW'}.get(lang,lang)
            release=catalog['cleaner_release'].get(copy_lang,catalog['cleaner_release'].get(lang.split('-')[0],catalog['cleaner_release']['en']))
            text=description(text,release[0])
            text=re.sub(r'(<p class="hero-note">)[\s\S]*?(</p>)',lambda m:m[1]+escape(release[1])+m[2],text,count=1)
            text=re.sub(r'<p>[^<]*Android[^<]*11[^<]*</p>',lambda m:'<p>'+escape(release[1])+'</p>',text)
            text=re.sub(r'<div class="release">[\s\S]*?</div>', '<div class="release"><span>iOS · Android</span><strong>App Store · ₩0</strong></div>',text,count=1)
            text=re.sub(r'(<span class="closing-note">)[\s\S]*?(</span>)',lambda m:m[1]+'App Store · ₩0'+m[2],text,count=1)
            def enable_cleaner(m):
                fragment=m[0]
                if 'data-store="appstore"' not in fragment:return fragment
                existing=soup(fragment).a.get('href','')
                store_url=existing if str(facts[product]['apple_id']) in existing else facts[product]['url']
                fragment=fragment.replace(' is-disabled','')
                fragment=re.sub(r'\s+(?:aria-disabled|tabindex|role|href)="[^"]*"','',fragment,count=0)
                fragment=fragment.replace('<a ',f'<a href="{store_url}" ',1)
                label=catalog['download_labels'].get(lang,catalog['download_labels'].get(lang.split('-')[0],'Download'))
                return re.sub(r'(<span class="store-btn__sub">)[\s\S]*?(</span>)',lambda n:n[1]+label+n[2],fragment)
            text=re.sub(r'<a\b[^>]*data-store-app="cleaner"[\s\S]*?</a>',enable_cleaner,text)
        if product=='seukscan' and 'support' not in rel.parts:
            def pending_scanner(m):
                fragment=m[0]
                if 'com.h1soft.scanner' not in fragment:return fragment
                fragment=re.sub(r'\s+href="[^"]*"','',fragment,count=1)
                fragment=fragment.replace('<a ', '<a aria-disabled="true" role="link" tabindex="-1" ',1)
                fragment=fragment.replace('class="store-btn','class="store-btn is-disabled',1)
                label=catalog['pending_labels'].get(lang,catalog['pending_labels'].get(lang.split('-')[0],'Coming soon'))
                return re.sub(r'(<span class="store-btn__sub">)[\s\S]*?(</span>)',lambda n:n[1]+label+n[2],fragment)
            text=re.sub(r'<a\b[^>]*>[\s\S]*?</a>',pending_scanner,text)
        if product and facts[product].get('price') is not None and 'support' not in rel.parts:
            fact=facts[product]
            platform='App Store' if fact.get('apple_id') else 'Google Play'
            price='₩0' if fact['currency']=='KRW' else 'US$0'
            current=soup(text)
            link=next((a['href'] for a in current.select('a[href]') if str(fact.get('apple_id','IMPOSSIBLE')) in a['href'] or (fact.get('package') and fact['package'] in a['href'])),fact['url'])
            text=block(text,'store-price',f'<p class="seo-store-price" style="text-align:center;margin:24px auto;font-size:0.875rem"><a href="{escape(link,quote=True)}" rel="noopener">{platform} · {price}</a></p>')
        def update_node(obj):
            if isinstance(obj,list):return [update_node(v) for v in obj]
            if not isinstance(obj,dict):return obj
            obj={k:update_node(v) for k,v in obj.items()}
            typ=obj.get('@type');types=typ if isinstance(typ,list) else [typ]
            if any(t in APP_TYPES for t in types):
                app=product
                if obj.get('url'):
                    parts=urlsplit(obj['url']).path.split('/')
                    app=next((key for key in facts if key in parts),app)
                fact=facts.get(app,{})
                if fact.get('price') is not None:
                    source=next((a.get('href') for a in doc.select('a[href]') if str(fact.get('apple_id','IMPOSSIBLE')) in a['href'] or (fact.get('package') and fact['package'] in a['href'])),fact['url'])
                    obj['offers']={'@type':'Offer','price':str(fact['price']),'priceCurrency':fact['currency'],'url':source}
                    # Do not create ratings: the public stores currently show none.
                if app=='cleaner':
                    obj['operatingSystem']='iOS 16.0+, Android 11+'
                    obj['installUrl']=fact['url']
                    obj['description']=catalog['cleaner_release'].get(lang,catalog['cleaner_release']['en'])[0]
            if product=='cleaner' and obj.get('@type')=='WebPage':obj['description']=release[0]
            return obj
        def ld(m):
            old=json.loads(m[2]);new=update_node(old)
            if new==old:return m[0]
            return m[1]+json.dumps(new,ensure_ascii=False,indent=2).replace('<','\\u003c')+m[3]
        text=re.sub(r'(<script\b[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>)([\s\S]*?)(</script>)',ld,text)
        if rel.as_posix() in ['gyeol/index.html','meowbro/index.html']:
            appname='결' if rel.parts[0]=='gyeol' else '냥브로 MEOWBRO'
            category='SocialNetworkingApplication' if rel.parts[0]=='gyeol' else 'GameApplication'
            image=doc.select_one('meta[property="og:image"]')['content']
            obj={'@context':'https://schema.org','@graph':[
                {'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':desc,'inLanguage':'ko','mainEntity':{'@id':url+'#app'}},
                {'@type':'MobileApplication','@id':url+'#app','name':appname,'url':url,'description':desc,'applicationCategory':category,'operatingSystem':'iOS, Android','inLanguage':'ko','image':image,'publisher':{'@type':'Organization','name':'H1Soft','url':BASE+'/'}},
                {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'H1Soft','item':BASE+'/'},{'@type':'ListItem','position':2,'name':appname,'item':url}]}]}
            text=schema_block(text,obj)
        write(path,text,changed)

def sitemaps(root,changed):
    ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);ET.register_namespace('xhtml','http://www.w3.org/1999/xhtml')
    # Canonicals come from the current output, not a hand-maintained language list.
    pages={url_for(p,root):soup(p.read_text()) for p in public_pages(root)}
    aliases={u:d.select_one('link[rel="canonical"]')['href'] for u,d in pages.items() if d.select_one('link[rel="canonical"]') and d.select_one('link[rel="canonical"]')['href']!=u}
    excluded={u for u,d in pages.items() if any('noindex' in m.get('content','').lower() for m in d.select('meta[name="robots"]'))}
    for path in root.rglob('*.xml'):
        if '_source' in path.parts or 'sitemap' not in path.name:continue
        text=path.read_text();tree=ET.fromstring(text);dirty=False
        for entry in list(tree):
            loc=entry.find('{*}loc')
            if loc is not None and (loc.text in aliases or loc.text in excluded):tree.remove(entry);dirty=True
        additions=[]
        if path==root/'sitemap.xml':additions=[BASE+'/gyeol/',BASE+'/attachment/pair/']
        if path==root/'attachment/sitemap.xml':additions=[BASE+'/attachment/pair/']
        existing={loc.text for loc in tree.findall('.//{*}loc')}
        for url in additions:
            if url not in existing:
                entry=ET.SubElement(tree,'{'+ns+'}url');ET.SubElement(entry,'{'+ns+'}loc').text=url;ET.SubElement(entry,'{'+ns+'}lastmod').text='2026-09-30';dirty=True
        if dirty:
            ET.indent(tree,space='  ')
            write(path,"<?xml version='1.0' encoding='utf-8'?>\n"+ET.tostring(tree,encoding='unicode')+'\n',changed)
    path=root/'robots.txt';text=path.read_text()
    for url in [BASE+'/gyeol/sitemap.xml',BASE+'/attachment/sitemap.xml']:
        if 'Sitemap: '+url not in text:text=text.rstrip()+'\nSitemap: '+url+'\n'
    write(path,text,changed)

def run(root):
    changed=set();attachment(root,changed);enrich_pages(root,changed);sitemaps(root,changed)
    changed.update(root / path for path in apply_favicons(root)['changed'])
    print(json.dumps({'changed':len(changed),'files':[str(p.relative_to(root)) for p in sorted(changed)]},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=HERE.parents[1]);args=parser.parse_args();run(args.root.resolve())
