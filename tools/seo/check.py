#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regression checks for crawlability, generated content and truthful store metadata."""
from pathlib import Path
from collections import defaultdict
from urllib.parse import urljoin, urlsplit
import json, re, sys, xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from enrich import BASE, HERE, ALIASES, APP_TYPES, public_pages, url_for

ROOT=HERE.parents[1];errors=[]
def require(condition,message):
    if not condition:errors.append(message)

def normalize(url):
    p=urlsplit(url);route=p.path
    if route.endswith('index.html'):route=route[:-10]
    return p._replace(path=route,query='',fragment='').geturl()

pages={url_for(p,ROOT):(p,BeautifulSoup(p.read_text(),'html.parser')) for p in public_pages(ROOT)}
indexable={u:(p,s) for u,(p,s) in pages.items() if not any('noindex' in m.get('content','') for m in s.select('meta[name="robots"]'))}
facts=json.loads((HERE/'store-facts.json').read_text())['apps']
refs=defaultdict(set);graph=defaultdict(set);json_count=0;price_count=0
for url,(path,s) in pages.items():
    rel=path.relative_to(ROOT).as_posix()
    require(s.title is not None and s.title.get_text(strip=True),f'{rel}: missing title')
    for selector in ['meta[name="description"]','meta[name="viewport"]','link[rel="canonical"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','meta[property="og:image"]','meta[name="twitter:card"]']:
        require(s.select_one(selector) is not None,f'{rel}: missing {selector}')
    require(len(s.select('h1'))==1,f'{rel}: expected one H1')
    for a in s.select('a[href]'):
        target=normalize(urljoin(url,a['href']))
        if target.startswith(BASE+'/'):
            refs[target].add(url);graph[url].add(target)
            require(urlsplit(target).path not in ALIASES,f'{rel}: link to noncanonical alias {target}')
    for img in s.select('img'):require(img.has_attr('alt'),f'{rel}: missing image alt')
    for el in s.select('script[type="application/ld+json"]'):
        try:obj=json.loads(el.string or el.get_text());json_count+=1
        except Exception as exc:errors.append(f'{rel}: invalid JSON-LD {exc}');continue
        def check_obj(obj):
            global price_count
            if isinstance(obj,list):
                for n in obj:check_obj(n)
            elif isinstance(obj,dict):
                typ=obj.get('@type');ts=typ if isinstance(typ,list) else [typ]
                if any(t in APP_TYPES for t in ts):
                    app=next((k for k in facts if k in urlsplit(obj.get('url',url)).path.split('/')),None)
                    if app and facts[app].get('price') is not None:
                        offer=obj.get('offers',{})
                        require(str(offer.get('price'))==str(facts[app]['price']),f'{rel}: wrong or missing verified price for {app}')
                        require(offer.get('priceCurrency')==facts[app]['currency'],f'{rel}: wrong currency')
                        price_count+=1
                    require('aggregateRating' not in obj and 'review' not in obj,f'{rel}: rating/review needs a new verified source')
                for v in obj.values():check_obj(v)
        check_obj(obj)

for lang,path in [('ko','index.html'),('en','en/index.html')]:
    text=(ROOT/path).read_text();s=BeautifulSoup(text,'html.parser');cards=s.select('.tool-card')
    require(len(cards)==12,f'{path}: expected 12 product cards')
    require(s.select_one('[data-count]')['data-count']=='12',f'{path}: old product count')
    require('12개의 앱' in text if lang=='ko' else 'Twelve apps' in text,f'{path}: stale metadata count')
    require(s.select_one('.tool-card[href="/gyeol/"]') is not None,f'{path}: missing Gyeol card')
    for script in s.select('script[type="application/ld+json"]'):
        obj=json.loads(script.string)
        if obj.get('@type')=='ItemList':require(obj['numberOfItems']==len(obj['itemListElement'])==12,f'{path}: schema product count')
    for c in cards:
        if c.get('href','').startswith(('/nonogram/','/cleaner/')):
            require('App Store' in c.select_one('.tool-card__badge').get_text(),f'{path}: stale release badge')
    require('iOS와 Android 출시를 준비하고 있습니다.' not in text and 'iOS and Android releases are coming soon.' not in text,f'{path}: stale Nonogram FAQ')

types=json.loads((HERE/'attachment-types.json').read_text());pairpages=[(p,s) for _,(p,s) in pages.items() if '/attachment/pair/' in str(p) and p.parent!=ROOT/'attachment/pair']
require(len(pairpages)==153,'expected 153 pairs')
descriptions=set();guides=set()
for p,s in pairpages:
    descriptions.add(s.select_one('meta[name="description"]')['content']);guide=s.select_one('#pair-guide')
    require(guide is not None and len(guide.get_text())>250,f'{p}: missing substantive pair guide')
    if guide:guides.add(guide.get_text())
    require(bool(refs[url_for(p,ROOT)]-{url_for(p,ROOT)}),f'{p}: pair has no inbound links')
require(len(descriptions)==153,'pair descriptions must be unique')
require(len(guides)==153,'pair guides must be unique')
for t in types:
    p=ROOT/'attachment/t'/t['slug']/'index.html';s=pages[url_for(p,ROOT)][1]
    require(len(s.select('#compatibility a[href*="/pair/"]'))==18,f'{p}: expected 17 pair links and an index link')
    p=ROOT/'attachment/with'/t['slug']/'index.html';s=pages[url_for(p,ROOT)][1]
    require(t['name'] in s.title.get_text() and t['name'] in s.h1.get_text(),f'{p}: generic invite title')
    require('noindex' in s.select_one('meta[name="robots"]')['content'],f'{p}: invite must stay out of search')
for route in ['attachment/play/','attachment/go/']:
    require(BASE+'/'+route not in indexable,f'{route}: execution/redirect page must be noindex')
visited=set();pending=[BASE+'/']
while pending:
    u=pending.pop()
    if u in visited:continue
    visited.add(u);pending.extend(graph[u]-visited)
require(BASE+'/gyeol/' in visited,'Gyeol not reachable from home')
require(BASE+'/attachment/pair/' in visited,'pair index not reachable from home')
require(all(url_for(p,ROOT) in visited for p,s in pairpages),'some pairs not reachable from home')

robots=(ROOT/'robots.txt').read_text();declared=re.findall(r'^Sitemap:\s*(\S+)',robots,re.M);listed=set()
for sitemap in ROOT.rglob('*sitemap*.xml'):
    if '_source' in sitemap.parts:continue
    tree=ET.fromstring(sitemap.read_text());locs=[e.text for e in tree.findall('.//{*}loc')]
    for u in locs:
        require(not(u in pages and u not in indexable),f'{sitemap.name}: noindex URL in sitemap {u}')
        if u in pages:
            canonical=pages[u][1].select_one('link[rel="canonical"]')['href']
            require(canonical==u,f'{sitemap.name}: noncanonical URL in sitemap {u}')
    if BASE+'/'+sitemap.relative_to(ROOT).as_posix() in declared:listed.update(locs)
require(BASE+'/gyeol/' in listed,'Gyeol missing from declared sitemaps')
require(BASE+'/attachment/pair/' in listed,'pair index missing from declared sitemaps')
for product in ['gyeol','meowbro']:
    require(pages[BASE+'/'+product+'/'][1].select_one('script[type="application/ld+json"]') is not None,f'{product}: missing structured data')
print(json.dumps({'public_pages':len(pages),'indexable':len(indexable),'json_ld_blocks':json_count,'verified_price_nodes':price_count,'unique_pair_descriptions':len(descriptions),'errors':errors},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
