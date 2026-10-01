#!/usr/bin/env python3
"""Check actual rendered links, coverage, target files, locales and fragments."""
from pathlib import Path
from urllib.parse import urlsplit,urljoin,unquote
from bs4 import BeautifulSoup
from collections import Counter
import json
from product_links import ROOT,BASE,PRODUCTS,inventory,destination,route,language,product

pages,routes,aliases=inventory(ROOT);errors=[];links=0;promos=Counter();documents={}
def require(test,message):
    if not test:errors.append(message)
def doc(path):
    if path not in documents:documents[path]=BeautifulSoup(path.read_text(),'html.parser')
    return documents[path]
for path,(s,text,key,lang,is_primary) in pages.items():
    rel=path.relative_to(ROOT);url=BASE+'/'+rel.as_posix()
    region=s.select_one('[data-h1soft-related]')
    if key:
        require(region is not None,f'{rel}: missing related products')
        if region:
            targets=[]
            for a in region.select('a[href]'):
                dest=aliases.get(route(a['href']));targets.append(dest)
                if dest:
                    expected=destination(routes,dest,lang)
                    require(a['href']==expected['url'],f'{rel}: wrong locale target {a["href"]}')
                    require(a.get('hreflang')==expected['lang'],f'{rel}: missing target language')
                    if language(lang)!=language(expected['lang']):require(a.select_one('.h1soft-link-language') is not None,f'{rel}: missing fallback language label')
                    image=a.select_one('img')
                    if is_primary:require(image is not None and image.get('src')==PRODUCTS[dest]['icon'],f'{rel}: wrong product icon')
            require(len(targets)==len(set(targets))==len(PRODUCTS)-1,f'{rel}: duplicate or incomplete list')
            require(set(targets)==set(PRODUCTS)-{key},f'{rel}: missing product or self link')
            promos['primary' if is_primary else 'secondary']+=1
    menu=s.select_one('#nav-dropdown')
    if menu and len({a.get('data-h1soft-product') for a in menu.select('a[data-h1soft-product]')})>2:
        require({a.get('data-h1soft-product') for a in menu.select('a[data-h1soft-product]')}==set(PRODUCTS),f'{rel}: incomplete product menu')
    for a in s.select('a[href]'):
        u=urlsplit(urljoin(url,a['href']))
        if u.netloc!='h1soft.github.io':continue
        links+=1
        require(not any(x in u.path.split('/') for x in ['skinping','lol.dating']),f'{rel}: retired app link {u.path}')
        target=ROOT/unquote(u.path.lstrip('/'));target=target/'index.html' if not target.suffix else target
        require(target.is_file(),f'{rel}: broken URL {a["href"]}')
        if target.is_file() and target.suffix=='.html' and u.fragment and not u.fragment.startswith(':~:'):
            d=doc(target);anchor=unquote(u.fragment)
            require(d.find(id=anchor) is not None or d.find('a',attrs={'name':anchor}) is not None,f'{rel}: missing fragment {a["href"]}')
        dest=aliases.get(route(u.path))
        if dest and dest!=key:
            require(route(u.path)==destination(routes,dest,lang)['url'],f'{rel}: cross-app locale mismatch {a["href"]}')
for file in ['index.html','en/index.html']:
    s=doc(ROOT/file)
    require({product(urlsplit(a['href']).path) for a in s.select('.tool-card')}==set(PRODUCTS),f'{file}: catalog differs from company home')
print(json.dumps({'pages':len(pages),'internal_links':links,'related_sections':dict(promos),'errors':errors},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
