#!/usr/bin/env python3
"""Static localization contract, including behavior data and crawlable alternates."""
from pathlib import Path
from urllib.parse import urljoin,urlsplit,parse_qs
from collections import Counter
import json,re,sys,xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent;BASE='https://h1soft.github.io'
manifest=json.loads((HERE/'manifest.json').read_text());langs=set(manifest['locales']);errors=[]
def require(ok,message):
 if not ok:errors.append(message)
indexed=set();seen={};titles=[]
for rel in manifest['pages']:
 p=ROOT/rel;s=BeautifulSoup(p.read_text(),'html.parser');lang=s.html['lang'];label=f'{rel}: '
 require(lang in langs,label+'unexpected language')
 require(s.html.get('dir')==('rtl' if lang=='fa' else 'ltr'),label+'wrong direction')
 require(len(s.select('h1'))==1,label+'expected one H1')
 canon=s.select('link[rel="canonical"]');require(len(canon)==1,label+'expected one canonical')
 url=BASE+('/' if rel=='index.html' else '/'+rel.removesuffix('index.html'));indexed.add(url)
 require(canon[0]['href']==url,label+'wrong canonical')
 alternatives={a['hreflang']:a['href'] for a in s.select('link[rel="alternate"][hreflang]')}
 require(set(alternatives)==langs|{'x-default'},label+'incomplete hreflang set')
 require(alternatives.get(lang)==url,label+'missing self alternate')
 seen[url]=(lang,alternatives)
 require(s.title and s.title.get_text().strip(),label+'empty title');titles.append(s.title.get_text())
 require(s.select_one('meta[name="description"]')['content'].strip(),label+'empty description')
 menu=s.select_one('.site-language-list');require(menu is not None,label+'missing language picker')
 require({a.get('hreflang') for a in menu.select('a')}==langs,label+'language picker incomplete')
 for el in s.select('script[type="application/ld+json"]'):json.loads(el.string)
 for tab in s.select('[role=tab][data-code]'):
  require(tab.strong and tab.strong.get_text()==tab['data-code'].upper(),label+'translated airport code '+tab['data-code'])
 for img in s.select('img'):require(img.has_attr('alt'),label+'image alt missing')
 for el in s.select('[src],[poster],link[href],a[href]'):
  raw=el.get('src') or el.get('poster') or el.get('href','')
  if raw.startswith(('data:','mailto:','tel:','#','javascript:')):continue
  parsed=urlsplit(urljoin(url,raw))
  if parsed.netloc!='h1soft.github.io':continue
  path=ROOT/parsed.path.lstrip('/')
  if parsed.path.endswith('/'):path=path/'index.html'
  require(path.exists(),label+'broken local link/resource '+raw)
 # Explicit foreign-language links are allowed; untranslated Korean copy isn't.
 if lang!='ko':
  for node in s.select('script,style,[lang="ko"],.site-language-list'):node.decompose()
  residual=set(re.findall('[가-힣]{2,}',s.get_text(' ',strip=True)))-{'한국어'}
  require(not residual,label+'Korean copy left behind: '+str(sorted(residual)))
for url,(lang,alts) in seen.items():
 for code,dest in alts.items():
  require(dest in seen,f'{url}: alternate URL missing {dest}')
  if code!='x-default' and dest in seen:require(seen[dest][1].get(lang)==url,f'{url}: nonreciprocal alternate {dest}')
sitemap=ET.parse(ROOT/'sitemap.xml');urls=[x.text for x in sitemap.findall('.//{*}loc')]
require(indexed<=set(urls),'localized pages missing from root sitemap')
require(len(urls)==len(set(urls)),'duplicate root sitemap URLs')
for lang in langs:
 copy=json.loads((HERE/'locales'/f'{lang}.json').read_text());inv=json.loads((HERE/'inventory.json').read_text())['strings']
 require(set(inv.values())<=copy.keys(),lang+': untranslated keys')
 for source,key in inv.items():
  if key in copy:require(Counter(re.findall(r'\{\w+\}',source))==Counter(re.findall(r'\{\w+\}',copy[key])),lang+': damaged variable '+key)
print(json.dumps({'pages':len(manifest['pages']),'locales':len(langs),'errors':errors},ensure_ascii=False,indent=2));sys.exit(bool(errors))
