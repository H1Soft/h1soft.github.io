#!/usr/bin/env python3
"""Build the 17-language public landing pages from versioned templates and copy.

No network calls. After editing templates or locales run this script, then
product_links.py and localize-store-links.mjs. Never silently omit a translation.
"""
import json,re,sys
from pathlib import Path
from urllib.parse import urljoin,urlsplit,urlunsplit,parse_qsl,urlencode
from bs4 import BeautifulSoup,Comment,Doctype
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
BASE='https://h1soft.github.io'
LANGS=['de','en','es','fa','fr','id','it','nl','pl','pt','ru','tr','vi','zh-CN','zh-TW','ko','ja']
NAMES=dict(zip(LANGS,['Deutsch','English','Español','فارسی','Français','Bahasa Indonesia','Italiano','Nederlands','Polski','Português','Русский','Türkçe','Tiếng Việt','简体中文','繁體中文','한국어','日本語']))
SOURCES={'home':'en','attachment':'ko','meowbro':'ko','nonogram':'en'}
SOURCE_URLS={'home':'/en/','attachment':'/attachment/','meowbro':'/meowbro/','nonogram':'/nonogram/'}
CATALOG=json.loads((HERE/'inventory.json').read_text())
INV=CATALOG['strings']
PRODUCTS=json.loads((ROOT/'tools/seo/products.json').read_text())['products']

def route(page,lang):
 if page=='home':return '/' if lang=='ko' else f'/{lang}/'
 if lang==('en' if page=='nonogram' else 'ko'):return f'/{page}/'
 return f'/{page}/{lang}/'

def normalized(text):return ' '.join(text.split())

def dictionary(lang):
 path=HERE/'locales'/f'{lang}.json'
 values=json.loads(path.read_text())
 missing=set(INV.values())-values.keys()
 if missing:raise ValueError(f'{lang}: {len(missing)} missing translations: {sorted(missing)[:8]}')
 out={s:values[k] for s,k in INV.items()}
 glossary=json.loads((HERE/'glossary.json').read_text()).get(lang,{})
 for source in out:
  if source in CATALOG['pages']['attachment']:
   for old,new in glossary.items():out[source]=out[source].replace(old,new)
 # Reuse the shipped app's character names and nicknames for consistent branding.
 appdir=ROOT/'attachment/play/assets/assets/i18n'
 appcode={'zh-CN':'zh_Hans_CN','zh-TW':'zh_Hant_TW'}.get(lang,lang)
 ko=json.loads((appdir/'ko.json').read_text())['strings']
 target=json.loads((appdir/f'{appcode}.json').read_text())['strings']
 for key,value in ko.items():
  if isinstance(value,str) and key in target and (key.startswith('t.') or not any(normalized(value) in CATALOG['pages'][p] for p in ['home','meowbro','nonogram'])):out[normalized(value)]=re.sub(r'\\u([0-9a-fA-F]{4})',lambda m:chr(int(m[1],16)),target[key])
 for prod in PRODUCTS.values():
  code={'zh-CN':'zh-hans','zh-TW':'zh-hant'}.get(lang,lang)
  label=prod['labels'].get(code,prod['labels']['en'])
  for src in ['ko','en']:
   for field in ['name','description']:out[prod['labels'][src][field]]=label[field]
 for value in INV:
  if value in {'ICN','HKG','SIN','DPS','DXB','CAI','ATH','VCE','CDG','KEF','JFK','CUZ'}:out[value]=value
  if re.match(r'^(?:No\.|Q\.|SERIES \d|ACT [IVX]|ICN [→/])',value):out[value]=value
 out['다운로드']=out['다운로드하기']
 out['H1Soft']='H1Soft'
 appname=target['ui.appTitle']
 out['애착인형 뽑기']=appname
 out['Attachment Plush']=appname
 out['© 2026 H1Soft · 애착인형 뽑기']='© 2026 H1Soft · '+appname
 out['Learn more (Korean) →']=out.get('Learn more →','Learn more →')
 if lang=='ko':out['Languages']='언어'
 out['h1.soft.x001@gmail.com']='h1.soft.x001@gmail.com'
 editorial=json.loads((HERE/'attachment-editorial.json').read_text())[lang]
 out['애착인형 뽑기 — 애착유형 테스트, 인형으로 뽑고 궁합까지']=appname+' — '+editorial[0]
 out['16문항 3분이면 나를 닮은 애착인형이 나와요. 16종 + 시크릿 1종, 친구와 빨간 실 궁합, 인형 도감까지. 무료로 뽑아 보세요.']=editorial[1]
 if lang=='fa':
  out['H1Soft — an IT technology startup building mobile apps']='H1Soft — استارتاپ فناوری و سازندهٔ برنامه‌های موبایل'
  out['쏟아지는 탄막. 끝없는 선택.']='رگبار گلوله‌ها. انتخاب‌های بی‌پایان.'
  out['작은 고양이가 판을 뒤집는']='یک گربهٔ کوچک ورق را برمی‌گرداند'
  out['액션 로그라이크.']='در این روگ‌لایک اکشن.'
 return out

def build(page,lang,copy):
 native=lang==SOURCES[page] or lang=='ko' and page in ['home','nonogram']
 template=page+('-ko' if lang=='ko' and page in ['home','nonogram'] else '')
 s=BeautifulSoup((HERE/'templates'/f'{template}.html.template').read_text(),'html.parser')
 canonical=BASE+route(page,lang)
 source=BASE+('/' if template=='home-ko' else '/nonogram/ko/' if template=='nonogram-ko' else SOURCE_URLS[page])
 def tr(text):
  key=normalized(text)
  if not native and key not in copy and re.search(r'[A-Za-z가-힣]',key):
   raise ValueError(f'{page}/{lang}: missing translation for {key!r}')
  return copy.get(key,key)
 # Product lists are rendered from their own reviewed 17-language catalog.
 for node in s.select('.h1soft-apps,[data-h1soft-related],.h1soft-link-language'):node.decompose()
 for node in s.select('#nav-dropdown'):
  node.clear()
  # Keep product renderer's discovery contract without retaining untranslated copy.
  for key in PRODUCTS:
   a=s.new_tag('a',href=f'/{key}/');a.string=key;node.append(a)
 for node in s.select('.lang-toggle,nav.language,[data-locale-banner]'):node.decompose()
 for node in s.select('a[data-language]'):node.decompose()
 if not native:
  for node in list(s.find_all(string=True)):
   if isinstance(node,(Comment,Doctype)) or node.parent.name in ['script','style','svg'] or node.find_parent('svg') or node.find_parent(id='nav-dropdown'):continue
   if normalized(str(node)):
    old=str(node);new=tr(old)
    node.replace_with((' ' if old[:1].isspace() else '')+new+(' ' if old[-1:].isspace() else ''))
  for node in s.find_all(True):
   for attr in ['alt','aria-label','title','placeholder']:
    if node.get(attr):node[attr]=tr(node[attr])
   if node.name=='meta' and (node.get('name') in ['description','twitter:title','twitter:description','twitter:image:alt'] or node.get('property') in ['og:title','og:description','og:site_name','og:image:alt']):node['content']=tr(node.get('content',''))
 if page=='home':
  editorial=json.loads((HERE/'home-editorial.json').read_text())[lang]
  # Preserve the original hero's noun-only highlights and description emphasis.
  for node,markup in [(s.h1,editorial[0]),(s.select_one('.hero__sub'),editorial[1])]:
   node.clear()
   for child in list(BeautifulSoup(markup,'html.parser').contents):node.append(child)
 s.html['lang']=lang;s.html['dir']='rtl' if lang=='fa' else 'ltr';s.html['data-public-i18n']=page
 # Resolve all resources against their original page, including relative scripts/fonts.
 for node in s.find_all(True):
  for attr in ['href','src','poster']:
   value=node.get(attr)
   if not value or value.startswith(('#','data:','mailto:','tel:','javascript:')):continue
   dest=urljoin(source,value)
   if dest.startswith(BASE):
    path=dest[len(BASE):]
    if attr=='href' and node.name=='a':
     # Keep navigation inside the matching localized landing pages.
     for key in SOURCES:
      if urlsplit(path).path in {SOURCE_URLS[key],route(key,'ko'),route(key,'en')}:
       u=urlsplit(path);path=route(key,lang)+('?' + u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
     if path.startswith('/attachment/play/'):
      u=urlsplit(path);q=dict(parse_qsl(u.query));q['lang']=lang;path=urlunsplit(('', '', u.path,urlencode(q),u.fragment))
     elif lang!='ko' and re.match(r'/attachment/(?:t|pair|about|support|privacy|terms)/',path):
      node['hreflang']='ko'
      # These editorial reference pages remain Korean; don't mislabel them as localized.
      if node.get('class') and 'plush-tile' in node.get('class',[]):pass
    if attr=='href' and node.name=='a':
     foreign=None
     if lang!='ko' and (re.match(r'/attachment/(?:t|pair|about|support|privacy|terms)/',path) or path=='/meowbro/privacy.html'):foreign='ko'
     if lang!='en' and (re.match(r'/nonogram/(?:privacy|terms|support)/',path) or re.match(r'/en/(?:privacy|terms)/',path)):foreign='en'
     if foreign:
      node['hreflang']=foreign
      badge=s.new_tag('small',attrs={'class':'reference-language','lang':foreign});badge.string='한국어' if foreign=='ko' else 'English';node.append(badge)
    node[attr]=path
 if page in ['nonogram','meowbro'] and lang!='ko':
  code={'zh-CN':'zh-hans','zh-TW':'zh-hant'}.get(lang,lang)
  product=PRODUCTS[page]['labels'][code]
  s.title.string=('Nonogram Trip' if page=='nonogram' else 'Meowbro')+' — '+product['description']
  for meta in s.select('meta[property="og:title"],meta[name="twitter:title"]'):meta['content']=s.title.get_text()
 # SEO: one canonical and a complete reciprocal alternate cluster.
 for el in s.select('link[rel="canonical"],link[rel="alternate"][hreflang]'):el.decompose()
 s.head.append(s.new_tag('link',rel='canonical',href=canonical))
 for code in LANGS:s.head.append(s.new_tag('link',rel='alternate',hreflang=code,href=BASE+route(page,code)))
 s.head.append(s.new_tag('link',rel='alternate',hreflang='x-default',href=BASE+route(page,'en')))
 for el in s.select('meta[property="og:url"]'):el['content']=canonical
 ogcodes={'en':'en_US','ko':'ko_KR','ja':'ja_JP','de':'de_DE','es':'es_ES','fa':'fa_IR','fr':'fr_FR','id':'id_ID','it':'it_IT','nl':'nl_NL','pl':'pl_PL','pt':'pt_BR','ru':'ru_RU','tr':'tr_TR','vi':'vi_VN','zh-CN':'zh_CN','zh-TW':'zh_TW'}
 og=s.select_one('meta[property="og:locale"]')
 if not og:og=s.new_tag('meta',property='og:locale');s.head.append(og)
 og['content']=ogcodes[lang]
 for el in s.select('meta[property="og:locale:alternate"]'):el.decompose()
 for code in LANGS:
  if code!=lang:s.head.append(s.new_tag('meta',property='og:locale:alternate',content=ogcodes[code]))
 def localized_schema(x):
  if isinstance(x,list):return [localized_schema(v) for v in x]
  if isinstance(x,dict):
   return {k:(lang if k=='inLanguage' and isinstance(v,str) else tr(v) if not native and k in ['name','description','text','headline','alternativeHeadline'] and isinstance(v,str) else localized_schema(v)) for k,v in x.items()}
  if isinstance(x,str) and (x==source or x.startswith(source+'#')):return canonical+x[len(source):]
  return x
 for el in s.select('script[type="application/ld+json"]'):el.string=json.dumps(localized_schema(json.loads(el.string)),ensure_ascii=False,separators=(',',':'))
 # Reuse Seukscan's language picker markup and keyboard behavior.
 chooser=BeautifulSoup((HERE/'templates/language-picker.html.template').read_text(),'html.parser').details
 chooser['class']=['locale-switch','site-languages']
 chooser.summary['aria-label']=tr('Languages')
 chooser.select_one('.is-active').string=NAMES[lang]
 chooser.select_one('.nav-col__label').string=tr('Languages')
 nav=chooser.select_one('.locale-switch__options');nav['aria-label']=tr('Languages')
 nav['class'].append('site-language-list')
 for a in nav.select('a'):
  code=a['lang'];a['href']=route(page,code);a.attrs.pop('aria-current',None)
  for icon in a.select('svg'):icon.decompose()
  if code==lang:
   a['aria-current']='page'
   a.append(BeautifulSoup('<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>','html.parser').svg)
 header=s.select_one('header')
 if header:(header.select_one('.site-header__inner,.nav-inner,.header-right') or header).append(chooser)
 else:s.body.insert(0,chooser)
 s.head.append(s.new_tag('link',rel='stylesheet',href='/assets/seukscan/locales.css'))
 s.head.append(s.new_tag('link',rel='stylesheet',href='/css/public-i18n.css?v=20261007-seukscan4'))
 if page in ['attachment','meowbro']:
  if page=='attachment':
   el=s.select_one('#promo-data');data=json.loads(el.string)
   for plush in data['types']:
    for k in ['name','nick']:plush[k]=tr(plush[k]) if lang!='ko' else plush[k]
   data['copy']=copy if lang!='ko' else {};data['locale']=lang
   el.string=json.dumps(data,ensure_ascii=False,separators=(',',':'))
  else:
   el=s.new_tag('script',type='application/json',id='page-copy');el.string=json.dumps(copy if lang!='ko' else {},ensure_ascii=False,separators=(',',':'));s.body.append(el)
 if lang=='fa' and s.select_one('a[href*="apps.apple.com"]'):
  note=s.new_tag('p',attrs={'class':'store-language-note','dir':'rtl'});note.string=tr('App Store opens in English because Persian is not supported by Apple.')
  (s.select_one('footer') or s.body).append(note)
 # Old nonogram language suggestion only knows en/ko; static selector replaces it.
 for el in s.select('script[src]'):
  if '/nonogram/_astro/Header.' in el['src']:el.decompose()
  elif '/meowbro/script.js' in el['src']:el['src']='/meowbro/script.js?v=20261007-i18n'
  elif '/attachment/app.js' in el['src']:el['src']='/attachment/app.js?v=20261007-i18n'
 s.body.append(s.new_tag('script',type='module',src='/js/public-i18n.mjs?v=20261007-seukscan4'))
 path=ROOT/route(page,lang).lstrip('/')/'index.html';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(str(s).rstrip()+'\n')
 return str(path.relative_to(ROOT))

if __name__=='__main__':
 outputs=[]
 for lang in LANGS:
  copy=dictionary(lang)
  for page in SOURCES:outputs.append(build(page,lang,copy))
 (HERE/'manifest.json').write_text(json.dumps({'locales':LANGS,'pages':outputs},indent=2)+'\n')
 print(f'Built {len(outputs)} static pages in {len(LANGS)} languages.')
