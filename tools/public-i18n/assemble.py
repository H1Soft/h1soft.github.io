"""Import public-copy translation drafts, preserving IDs, variables and app brands.
This is an import utility; production builds only read the reviewed locale JSONs.
"""
import json,re
from pathlib import Path
HERE=Path(__file__).resolve().parent
INV=json.loads((HERE/'inventory.json').read_text())['strings']
LANGS=['de','en','es','fa','fr','id','it','nl','pl','pt','ru','tr','vi','zh-CN','zh-TW','ko','ja']
for lang in LANGS:
 out={key:text for text,key in INV.items() if lang=='ko' or ('ko' if re.search('[가-힣]',text) else 'en')==lang}
 for p in sorted((HERE/'drafts').glob(f'g-{lang}-*.txt'),key=lambda p:int(p.stem.rsplit('-',1)[1])):
  text=re.sub(r'【\[(T\d{4})\]】',r'[[\1]]',p.read_text())
  for m in re.finditer(r'\[\[\s*(T\d{4})\s*\]\]\s*(.*?)(?=\[\[\s*T\d{4}\s*\]\]|\Z)',text,re.S):
   value=' '.join(m[2].split()).strip()
   if value:out[m[1]]=value
 if lang=='en':out.update(json.loads((HERE/'english-reviewed.json').read_text()))
 # Variables must remain literal; replace translated placeholder names positionally.
 for source,key in INV.items():
  if key not in out:continue
  original=re.findall(r'\{[^{}]+\}',source)
  translated=re.findall(r'\{[^{}]+\}',out[key])
  if original and sorted(original)!=sorted(translated) and len(original)==len(translated):
   bridge=json.loads((HERE/'english-reviewed.json').read_text()).get(key,source)
   expected=iter(re.findall(r'\{[^{}]+\}',bridge))
   out[key]=re.sub(r'\{[^{}]+\}',lambda _:next(expected),out[key])
  for brand in ['H1Soft','App Store','Google Play','iPhone','Android','iOS','Nonogram Trip','MEOWBRO','SAGAK']:
   if source==brand:out[key]=brand
 out.update(json.loads((HERE/'overrides.json').read_text()).get(lang,{}))
 missing=set(INV.values())-out.keys()
 if not missing:
  (HERE/'locales'/f'{lang}.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
  print(lang,'complete',len(out))
 else:print(lang,'missing',len(missing))
