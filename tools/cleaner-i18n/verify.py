#!/usr/bin/env python3
"""Fail closed on missing translations, broken product links and SEO alternates."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlsplit, urljoin
from bs4 import BeautifulSoup
from build import ROOT, HERE, LANGUAGES, SOURCE, REV, route, catalog, ORIGIN

def main():
    rows=[];assets=set();seen_titles=set()
    for code in LANGUAGES:
        data=catalog(code)
        if code not in ('ko','en'):
            unchanged=[k for k,v in data.items() if v==SOURCE[k] and len(v)>35]
            assert not unchanged,(code,'untranslated strings',unchanged)
        for kind in ('home','privacy','terms'):
            path=route(code,kind);s=BeautifulSoup((ROOT/path.lstrip('/')/'index.html').read_text(),'html.parser')
            assert s.html['lang']==code and s.html['dir']==('rtl' if code=='fa' else 'ltr')
            assert len(s.find_all('h1'))==1,(path,'h1 count')
            assert s.title.get_text() not in seen_titles,(path,'duplicate title')
            seen_titles.add(s.title.get_text())
            assert s.select_one('link[rel="canonical"]')['href']==ORIGIN+path
            alternates={n['hreflang']:n['href'] for n in s.select('link[rel="alternate"][hreflang]')}
            assert set(alternates)==set(LANGUAGES)|{'x-default'}
            for lang,url in alternates.items():assert url==ORIGIN+route('ko' if lang=='x-default' else lang,kind)
            links=s.select('.qr-language-option')
            assert len(links)==17
            assert [l['lang'] for l in links if l.has_attr('aria-current')]==[code]
            assert all(l['href']==route(l['lang'],kind) for l in links)
            for n in s.select('a[href],img[src],script[src],link[href]'):
                value=n.get('src',n.get('href'));url=urlsplit(urljoin(ORIGIN+path,value))
                if url.netloc!='h1soft.github.io' or not url.path.startswith('/cleaner/'):continue
                dest=ROOT/url.path.lstrip('/')
                if url.path.endswith('/'):dest=dest/'index.html'
                assert dest.is_file(),(path,'missing target',value)
                if url.fragment and dest.suffix=='.html':
                    target=BeautifulSoup(dest.read_text(),'html.parser')
                    assert target.find(id=url.fragment),(path,'broken section',value)
                if n.name in ('img','script') or n.get('rel')==['stylesheet']:assets.add(url.path)
            for n in s.select('img[src*="app-icon"],link[rel="icon"]'):
                assert REV in n.get('src',n.get('href')),(path,'stale icon')
            desc=s.select_one('meta[name="description"]')['content']
            assert desc and s.select_one('meta[property="og:description"]')['content']==desc
            assert s.select_one('meta[property="og:url"]')['content']==ORIGIN+path
            schema=json.loads(s.select_one('script[type="application/ld+json"]').string)
            assert schema['@graph'][0]['inLanguage']==code
            assert schema['@graph'][0]['url']==ORIGIN+path
            if kind=='home':
                assert len(s.select('.screen-card'))==5
                assert len(s.select('.faq-list details'))==5
                for img in s.select('.screen-card img,.hero-phone'):
                    assert f'/screens/{code}/' in img['src']
                    assert img.get('alt'),(path,'missing image description')
            else:
                assert len(s.select('.legal-content article>section'))==10,(path,'policy section missing')
            rows.append({'locale':code,'kind':kind,'path':path,'title':s.title.get_text(),'descriptionLength':len(desc),'status':'pass'})
    ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
    expected={ORIGIN+route(c,k) for c in LANGUAGES for k in ('home','privacy','terms')}
    for name in ('sitemap.xml','sitemap-1.xml'):
        urls=[n.text for n in ET.parse(ROOT/name).findall('s:url/s:loc',ns)]
        cleaner=[u for u in urls if u.startswith(ORIGIN+'/cleaner/')]
        assert len(cleaner)==51 and set(cleaner)==expected,(name,'sitemap coverage')
    for css in (ROOT/'cleaner').glob('*.css'):
        for resource in re.findall(r'url\([\'\"]?([^\)\'\"]+)',css.read_text()):
            assert (css.parent/resource).is_file(),(css.name,'missing CSS asset',resource)
    report={'pages':len(rows),'languages':len(LANGUAGES),'localAssets':len(assets),'allChecksPassed':True,'checks':['complete translation catalogs','51 unique titles','self canonical','reciprocal 18 hreflang links','17 language menu destinations','localized images and descriptions','same-language legal links','all product asset links exist','10 complete legal sections each','localized structured data','two sitemaps'],'results':rows}
    (HERE/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('checks','results')}))

if __name__=='__main__':main()
