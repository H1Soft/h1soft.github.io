#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render complete, locale-aware product navigation into exported static pages."""
from pathlib import Path
from urllib.parse import urlsplit, urljoin
from html import escape
from collections import Counter
import argparse, json, re
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[2]
BASE='https://h1soft.github.io'
DATA=json.loads((Path(__file__).parent/'products.json').read_text())
PRODUCTS=DATA['products']
SKIP={'_source','node_modules','tools','metrics','admin','identity','share','review','play','go'}
CSS='<link rel="stylesheet" href="/css/product-links.css">'

def language(lang):
    lang=lang.lower().replace('_','-')
    if lang in {'zh-cn','zh-sg','zh-hans'}:return 'zh-hans'
    if lang in {'zh-tw','zh-hk','zh-hant'}:return 'zh-hant'
    return lang.split('-')[0]

def route(url):
    path=urlsplit(url).path
    if path.endswith('index.html'):path=path[:-10]
    return path if path.endswith('/') else path+'/'

def product(path):return next((x for x in Path(path).parts if x in PRODUCTS),None)

def primary(path):
    parts=path.parts[:-1]
    return path.name=='index.html' and len(parts)<=2 and all(x in PRODUCTS or re.fullmatch(r'[a-z]{2}(?:-[A-Za-z]{2,4})?',x) for x in parts)

def inventory(root):
    pages={};routes={p:{} for p in PRODUCTS};aliases={}
    for path in sorted(root.rglob('*.html')):
        rel=path.relative_to(root)
        if any(x.startswith('.') or x in SKIP for x in rel.parts):continue
        text=path.read_text();s=BeautifulSoup(text,'html.parser')
        if not s.html or not s.body or s.select_one('meta[name="robots"][content*="noindex"]'):continue
        key=product(rel);url=BASE+'/'+rel.as_posix();lang=s.html.get('lang','en')
        pages[path]=(s,text,key,lang,primary(rel) and key is not None)
        if primary(rel) and key:
            canonical=s.select_one('link[rel="canonical"]')
            dest=route(canonical['href'] if canonical else url)
            aliases[route(url)]=key;aliases[dest]=key
            routes[key].setdefault(language(lang),{'url':dest,'lang':lang})
            # Exact regional language wins when both pt and pt-BR exist.
            routes[key][lang.lower()]={'url':dest,'lang':lang}
    return pages,routes,aliases

def destination(routes,key,lang):
    choices=routes[key]
    return choices.get(lang.lower()) or choices.get(language(lang)) or choices.get('en') or choices['ko']

def label(key,lang):
    labels=PRODUCTS[key]['labels'];locale=language(lang)
    return (labels[locale],locale) if locale in labels else (labels['en'],'en')

def link(key,lang,routes,kind):
    target=destination(routes,key,lang);copy,textlang=label(key,lang)
    badge=''
    if language(target['lang'])!=language(lang):
        name='한국어' if language(target['lang'])=='ko' else 'English'
        badge=f'<small class="h1soft-link-language" lang="{escape(target["lang"])}">{name}</small>'
    attrs=f'href="{target["url"]}" hreflang="{target["lang"]}" lang="{textlang}" data-h1soft-product="{key}"'
    name=escape(copy['name']);desc=escape(copy['description']);icon=PRODUCTS[key]['icon']
    if kind=='compact':return f'<a {attrs}>{name}{badge}</a>'
    if kind=='menu':
        return f'<a class="nav-item" {attrs}><img src="{icon}" alt="" width="28" height="28" loading="lazy"><span><span class="nav-item__name">{name}</span><span class="nav-item__type">{desc}{badge}</span></span></a>'
    cls='more-card' if kind=='more' else 'h1soft-app-link'
    textcls='more-card__text' if kind=='more' else 'h1soft-app-text'
    namecls='more-card__name' if kind=='more' else 'h1soft-app-name'
    desccls='more-card__desc' if kind=='more' else 'h1soft-app-description'
    return f'<a class="{cls}" {attrs}><img src="{icon}" alt="" width="40" height="40" loading="lazy"><span class="{textcls}"><span class="{namecls}">{name}</span><span class="{desccls}">{desc}</span>{badge}</span></a>'

def span(text,node):
    start=sum(len(line) for line in text.splitlines(keepends=True)[:node.sourceline-1])+node.sourcepos
    depth=0
    for m in re.finditer(r'</?'+re.escape(node.name)+r'\b[^>]*>',text[start:],re.I):
        depth+=-1 if m[0].startswith('</') else 1
        if depth==0:return start,start+m.end()
    raise ValueError(f'Unclosed {node.name} at {start}')

def render(root,check=False):
    pages,routes,aliases=inventory(root);changed=[];counts=Counter();normalizations=0
    for path,(s,text,key,lang,is_primary) in pages.items():
        edits=[];replaced=[];new_style=False
        def replace(node,html):
            a,b=span(text,node);edits.append((a,b,html));replaced.append((a,b))
        def covered(node):
            a,b=span(text,node)
            return any(x<=a and b<=y for x,y in replaced)
        # Product dropdowns only; language menus remain intact.
        for menu in s.select('#nav-dropdown'):
            if len({product(urlsplit(urljoin(BASE+'/'+path.relative_to(root).as_posix(),a.get('href',''))).path) for a in menu.select('a[href]')}-{None})<3:continue
            opening=re.match(r'<[^>]+>',text[span(text,menu)[0]:])[0]
            replace(menu,opening+'\n'+'\n'.join(link(p,lang,routes,'menu') for p in PRODUCTS)+'\n</'+menu.name+'>');new_style=True
        footer=s.select_one('footer')
        if key:
            others=[p for p in PRODUCTS if p!=key]
            existing=s.select_one('[data-h1soft-related]')
            grid=s.select_one('.more-grid') if is_primary else None
            if grid:
                replace(grid,'<div class="more-grid" data-h1soft-related="cards">\n'+'\n'.join(link(p,lang,routes,'more') for p in others)+'\n</div>')
            else:
                compact=not is_primary;kind='compact' if compact else 'cards'
                title=DATA['headings'].get(language(lang),DATA['headings']['en'])
                items='\n'.join(link(p,lang,routes,'compact' if compact else 'card') for p in others)
                html=f'<aside class="h1soft-apps'+(' h1soft-apps--compact' if compact else '')+f'" data-h1soft-related="{kind}" aria-labelledby="h1soft-apps-title"><div class="h1soft-apps-inner"><h2 id="h1soft-apps-title">{escape(title)}</h2><nav class="h1soft-app-'+('list' if compact else 'grid')+f'" aria-label="{escape(title)}">\n{items}\n</nav></div></aside>'
                if existing:replace(existing,html)
                else:
                    pos=span(text,footer)[0] if footer else text.rindex('</body>');edits.append((pos,pos,html+'\n'))
            counts['primary' if is_primary else 'secondary']+=1;new_style=True
            # Move old partial product lists out of policy/contact/language footers.
            for a in footer.select('a[href]') if footer else []:
                target=urlsplit(urljoin(BASE+'/'+path.relative_to(root).as_posix(),a['href']))
                dest=aliases.get(route(target.path)) if target.netloc=='h1soft.github.io' else None
                if dest and dest!=key and not target.fragment:replace(a,'')
        # Existing cross-product links should preserve the reader's language too.
        for a in s.select('a[href]'):
            if covered(a):continue
            target=urlsplit(urljoin(BASE+'/'+path.relative_to(root).as_posix(),a['href']))
            dest=aliases.get(route(target.path)) if target.netloc=='h1soft.github.io' else None
            if not dest or dest==key:continue
            selected=destination(routes,dest,lang)
            href=selected['url']+('?' + target.query if target.query else '')+('#'+target.fragment if target.fragment else '')
            start,end=span(text,a);old=text[start:end]
            opening=re.match(r'<a\b[^>]*>',old)[0]
            new=re.sub(r'\bhref=([\"\'])(.*?)\1',lambda m:f'href="{escape(href,quote=True)}"',opening,count=1)
            new=re.sub(r'\s+hreflang=([\"\'])(.*?)\1','',new)
            new=new[:-1]+f' hreflang="{selected["lang"]}">'
            if new!=opening:
                edits.append((start,start+len(opening),new));normalizations+=1
        if new_style and not s.select_one('link[href="/css/product-links.css"]'):
            pos=text.index('</head>');edits.append((pos,pos,CSS+'\n'))
        result=text
        for start,end,html in sorted(edits,reverse=True):result=result[:start]+html+result[end:]
        if result!=text:
            changed.append(str(path.relative_to(root)))
            if not check:path.write_text(result)
    return {'scanned':len(pages),'navigation':dict(counts),'normalized_links':normalizations,'changed':changed}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    result=render(ROOT,args.check);print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(bool(args.check and result['changed']))
