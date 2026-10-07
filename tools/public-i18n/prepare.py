"""Extract complete static/dynamic translation inventories. Public marketing copy only."""
import json,re
from pathlib import Path
from bs4 import BeautifulSoup,Comment,Doctype
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
EXTRA={
'attachment':['{name} 인형 — {nick}','다른 인형 구경하기. 현재 {name}','{name}! 톡 누르면 다른 친구가 나와요','인형을 불러오지 못했어요. 한 번 더 톡 눌러 주세요','{filter} 인형 {count}종을 보고 있어요'],
'meowbro':['플레이 영상 재생','플레이 영상 일시정지','실제 개발 빌드 화면','다운로드하기','App Store에서 냥브로 다운로드'],
'home':[], 'nonogram':[]}
# Include the copy shown after interacting with gameplay and world tabs.
js=(ROOT/'meowbro/script.js').read_text()
EXTRA['meowbro']+= [s.replace('\\n','\n') for s in re.findall(r"(?:word|title|text|name|alt): '([^']*)'",js)]
EXTRA['home']+=['Languages','App Store opens in English because Persian is not supported by Apple.','Learn more →']
EXISTING=json.loads((HERE/'inventory.json').read_text())['strings'] if (HERE/'inventory.json').exists() else {}
next_id=max((int(key[1:]) for key in EXISTING.values()),default=-1)+1
ALL={}; pages={}
for page in ['home','attachment','meowbro','nonogram']:
 s=BeautifulSoup((HERE/'templates'/f'{page}.html.template').read_text(),'html.parser')
 for el in s.select('.h1soft-apps,[data-h1soft-related],#nav-dropdown,.h1soft-link-language'):el.decompose()
 vals=[]
 def add(v):
  v=' '.join(v.split())
  if v and re.search(r'[A-Za-z\u00c0-\uffff]',v) and not re.fullmatch(r'[\d\s.×+%/·–—!?©®™-]+',v):
   if v not in vals:vals.append(v)
 for n in s.find_all(string=True):
  if not isinstance(n,(Comment,Doctype)) and n.parent.name not in ['script','style','svg'] and not n.find_parent('svg'):add(str(n))
 for el in s.find_all(True):
  for attr in ['alt','aria-label','title','placeholder']:
   if el.get(attr):add(el[attr])
  if el.name=='meta' and (el.get('name') in ['description','twitter:title','twitter:description','twitter:image:alt'] or el.get('property') in ['og:title','og:description','og:site_name','og:image:alt']):add(el.get('content',''))
 def walk(x):
  if isinstance(x,dict):
   for k,v in x.items():
    if k in ['name','description','text','headline','alternativeHeadline'] and isinstance(v,str):add(v)
    else:walk(v)
  elif isinstance(x,list):
   for v in x:walk(v)
 for el in s.select('script[type="application/ld+json"]'):
  walk(json.loads(el.string))
 for v in EXTRA[page]:add(v)
 pages[page]=vals
 for v in vals:
  if v not in ALL:
   if v in EXISTING:ALL[v]=EXISTING[v]
   else:ALL[v]=f'T{next_id:04d}';next_id+=1
(HERE/'inventory.json').write_text(json.dumps({'strings':ALL,'pages':pages},ensure_ascii=False,indent=2))
# Draft translation batches below the UI's normal 1,000-character limit.
chunks=[]
for source in ['en','ko']:
 batch=[];size=0
 for text,key in ALL.items():
  if ('ko' if re.search('[가-힣]',text) else 'en')!=source:continue
  line=f'[[{key}]] {text}'
  if size+len(line)+1>950:
   chunks.append({'source':source,'text':'\n'.join(batch)});batch=[];size=0
  batch.append(line);size+=len(line)+1
 if batch:chunks.append({'source':source,'text':'\n'.join(batch)})
(HERE/'batches.json').write_text(json.dumps(chunks,ensure_ascii=False,indent=2))
print('strings',len(ALL),'characters',sum(map(len,ALL)),'batches',len(chunks))
