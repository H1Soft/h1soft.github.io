#!/usr/bin/env python3
"""Localized search metadata and page identities; never rewrite visible content."""
import json, re, sys
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
BASE='https://h1soft.github.io'
COPY=json.loads((HERE/'seo-copy.json').read_text())
sys.path.insert(0,str(ROOT/'tools/seo'))
from product_links import inventory, destination, product

@lru_cache(maxsize=1)
def product_routes():
    return inventory(ROOT)[1]

def nodes(value):
    if isinstance(value,dict):
        yield value
        for child in value.values():yield from nodes(child)
    elif isinstance(value,list):
        for child in value:yield from nodes(child)

def optimize(s,page,lang):
    copy=COPY[lang][page]
    canonical=s.select_one('link[rel="canonical"]')['href']
    home=BASE+('/' if lang=='ko' else f'/{lang}/')
    s.title.string=copy['title']
    for attr,key,value in [('name','description',copy['description']),('property','og:title',copy['title']),('property','og:description',copy['description']),('name','twitter:title',copy['title']),('name','twitter:description',copy['description'])]:
        matches=s.select(f'meta[{attr}="{key}"]')
        if not matches:
            meta=s.new_tag('meta',attrs={attr:key});s.head.append(meta);matches=[meta]
        matches[0]['content']=value
        for duplicate in matches[1:]:duplicate.decompose()
    scripts=s.select('script[type="application/ld+json"]')
    records=[json.loads(script.string) for script in scripts]
    flat=[node for record in records for node in nodes(record)]
    page_nodes=[node for node in flat if node.get('@type') in ['WebPage','CollectionPage']]
    app_nodes=[node for node in flat if node.get('@type') in ['SoftwareApplication','WebApplication','MobileApplication']]
    if not page_nodes:
        node={'@context':'https://schema.org','@type':'CollectionPage' if page=='home' else 'WebPage'}
        records.append(node);page_nodes=[node]
    for node in page_nodes:
        node.update({'@id':canonical+'#webpage','url':canonical,'name':copy['title'],'description':copy['description'],'inLanguage':lang})
    for node in flat:
        if node.get('@type')=='FAQPage':
            node.update({'@id':canonical+'#faq','url':canonical,'inLanguage':lang})
        elif node.get('@type')=='BreadcrumbList':
            for entry in node.get('itemListElement',[]):
                if entry.get('position')==1:entry['item']=home
        elif node.get('@type')=='WebSite':
            node['inLanguage']=lang
    if page!='home':
        for node in app_nodes:
            node.setdefault('@id',canonical+'#app')
            node.update({'url':canonical,'description':copy['description']})
            page_nodes[0]['mainEntity']={'@id':node['@id']}
        if not any(node.get('@type')=='BreadcrumbList' for node in flat):
            appname=app_nodes[0]['name'] if app_nodes else copy['title'].split(' — ')[0]
            records.append({'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'H1Soft','item':home},{'@type':'ListItem','position':2,'name':appname,'item':canonical}]})
    else:
        for node in app_nodes:
            key=product(Path(urlsplit(node.get('url','')).path))
            if key:node['url']=BASE+destination(product_routes(),key,lang)['url']
        for node in flat:
            if node.get('@type')=='ItemList':
                node['@id']=canonical+'#apps'
                page_nodes[0]['mainEntity']={'@id':node['@id']}
    # SoftwareApplication.inLanguage describes the app, not the landing page.
    # Preserve verified app language support; the WebPage carries the page locale.
    for index,record in enumerate(records):
        if index<len(scripts):script=scripts[index]
        else:script=s.new_tag('script',type='application/ld+json');s.head.append(script)
        script.string=json.dumps(record,ensure_ascii=False,separators=(',',':'))

if __name__=='__main__':
    manifest=json.loads((HERE/'manifest.json').read_text())
    for name in manifest['pages']:
        path=ROOT/name;original=path.read_text();s=BeautifulSoup(original,'html.parser')
        optimize(s,s.html['data-public-i18n'],s.html['lang'])
        # Keep the restored body/UI byte-for-byte intact.
        updated=re.sub(r'<head\b[^>]*>.*?</head>',lambda _:str(s.head),original,count=1,flags=re.S)
        path.write_text(updated)
    print(f'Optimized search metadata for {len(manifest["pages"])} pages.')
