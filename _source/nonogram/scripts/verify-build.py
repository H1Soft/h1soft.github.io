from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re,json,gzip
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.tags=[];self.ids=set();self.text=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs);self.tags.append((t,a))
  if 'id'in a:self.ids.add(a['id'])
 def handle_data(self,text):self.text.append(text)
errors=[];pages=[]
for file in dist.rglob('*.html'):
 p=Page();s=file.read_text();p.feed(s)
 route='/nonogram/'+str(file.relative_to(dist)).replace('index.html','')
 if file.name!='404.html':
  canonical=[a.get('href')for t,a in p.tags if t=='link'and a.get('rel')=='canonical']
  if canonical!=['https://h1soft.github.io'+route]:errors.append((route,'canonical',canonical))
  alt=[a.get('hreflang')for t,a in p.tags if t=='link'and a.get('rel')=='alternate']
  if sorted(alt)!=['en','ko','x-default']:errors.append((route,'hreflang',alt))
 description=next(a.get('content','')for t,a in p.tags if t=='meta'and a.get('name')=='description')
 if len(description)>155:errors.append((route,'description length',len(description)))
 if sum(t=='h1'for t,a in p.tags)!=1:errors.append((route,'h1'))
 for t,a in p.tags:
  for key in ['src','href','poster','data-src']:
   value=a.get(key,'');url=urlsplit(value)
   if not value or url.netloc or url.scheme or not url.path.startswith('/nonogram/'):continue
   target=dist/unquote(url.path[len('/nonogram/'):])
   if url.path.endswith('/'):target=target/'index.html'
   if not target.exists():errors.append((route,'missing',value))
   elif url.fragment and target.suffix=='.html':
    q=Page();q.feed(target.read_text())
    if url.fragment not in q.ids:errors.append((route,'anchor',value))
  if t=='img'and'alt'not in a:errors.append((route,'image alt'))
 for data in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',s,re.S):
  json.loads(data)
 if re.search(r'\b(?:no ads|ad-free|forever)\b|광고\s*없|영구',' '.join(p.text),re.I):errors.append((route,'prohibited product wording'))
 pages.append(route)
js={p.name:len(gzip.compress(p.read_bytes()))for p in (dist/'_astro').glob('*.js')}
fonts={p.name:p.stat().st_size for p in (dist/'fonts').glob('*.woff2')}
assert sum(js.values())<=28000,js
assert sum(fonts.values())<=320000,fonts
assert all(p.stat().st_size<=90000 for p in (dist/'images').glob('city-*.avif'))
report={'pages':pages,'jsGzipBytes':js,'totalJsGzipBytes':sum(js.values()),'fontBytes':fonts,'totalFontBytes':sum(fonts.values()),'errors':errors}
(root/'reports').mkdir(exist_ok=True);(root/'reports/build-audit.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,ensure_ascii=False));assert not errors
