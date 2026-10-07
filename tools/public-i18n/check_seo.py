#!/usr/bin/env python3
"""SEO invariants across all localized landing pages, independent of the builder."""
from pathlib import Path
from urllib.parse import urlsplit
import json,sys,xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'tools/public-i18n/manifest.json').read_text())
sitemap=ET.parse(ROOT/'sitemap.xml')
entries={node.find('{*}loc').text:node for node in sitemap.findall('{*}url')}
errors=[];titles=set();descriptions=set()
def check(ok,message):
    if not ok:errors.append(message)
def nodes(value):
    if isinstance(value,dict):
        yield value
        for child in value.values():yield from nodes(child)
    elif isinstance(value,list):
        for child in value:yield from nodes(child)
for name in manifest['pages']:
    s=BeautifulSoup((ROOT/name).read_text(),'html.parser');lang=s.html['lang']
    title=s.title.get_text();desc=s.select_one('meta[name="description"]')['content'];url=s.select_one('link[rel="canonical"]')['href']
    check(title not in titles,name+': duplicate title');titles.add(title)
    check(desc not in descriptions,name+': duplicate description');descriptions.add(desc)
    for attr,key,value in [('property','og:title',title),('property','og:description',desc),('name','twitter:title',title),('name','twitter:description',desc)]:
        metas=s.select(f'meta[{attr}="{key}"]')
        check(len(metas)==1 and metas[0]['content']==value,name+': inconsistent '+key)
    check(all('noindex' not in x.get('content','').lower() for x in s.select('meta[name="robots"]')),name+': blocked indexing')
    flat=[node for el in s.select('script[type="application/ld+json"]') for node in nodes(json.loads(el.string))]
    pages=[n for n in flat if n.get('@type') in ['WebPage','CollectionPage']]
    check(len(pages)==1,name+': expected one page identity')
    if pages:
        p=pages[0];check(p.get('inLanguage')==lang and p.get('url')==url and p.get('name')==title and p.get('description')==desc,name+': page schema mismatch')
    for n in flat:
        if n.get('@type')=='FAQPage':check(n.get('inLanguage')==lang and n.get('url')==url,name+': FAQ schema mismatch')
        if n.get('@type')=='BreadcrumbList':
            first=n['itemListElement'][0]['item'];check(first=='https://h1soft.github.io/'+('' if lang=='ko' else lang+'/'),name+': breadcrumb locale mismatch')
        if n.get('@type') in ['SoftwareApplication','WebApplication','MobileApplication']:
            appurl=n.get('url','');path=ROOT/urlsplit(appurl).path.lstrip('/')/'index.html'
            if appurl.startswith('https://h1soft.github.io/'):
                check(path.exists(),name+': missing app destination '+appurl)
                if path.exists():
                    target=BeautifulSoup(path.read_text(),'html.parser')
                    alternates={a['hreflang']:a['href'] for a in target.select('link[rel="alternate"][hreflang]')}
                    check(lang not in alternates or alternates[lang]==appurl,name+': app URL ignores available locale '+appurl)
    check(url in entries,name+': absent from sitemap')
    if url in entries:
        html_alts={a['hreflang']:a['href'] for a in s.select('link[rel="alternate"][hreflang]')}
        xml_alts={a.get('hreflang'):a.get('href') for a in entries[url].findall('{*}link')}
        check(html_alts==xml_alts,name+': sitemap alternates differ from HTML')
print(json.dumps({'pages':len(manifest['pages']),'uniqueTitles':len(titles),'uniqueDescriptions':len(descriptions),'errors':errors},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
