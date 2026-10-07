"""Refresh sitemap entries from canonical HTML; keep existing sitemap partitions."""
from pathlib import Path
from urllib.parse import urlsplit
import json,xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]; BASE='https://h1soft.github.io'
NS='http://www.sitemaps.org/schemas/sitemap/0.9';XH='http://www.w3.org/1999/xhtml'
ET.register_namespace('',NS);ET.register_namespace('xhtml',XH)
manifest=json.loads((ROOT/'tools/public-i18n/manifest.json').read_text())
localized={BASE+('/' if p=='index.html' else '/'+p.removesuffix('index.html')):p for p in manifest['pages']}
# Remove outdated entries for these landing pages from every existing partition.
for path in ROOT.rglob('*sitemap*.xml'):
 if any(x in path.parts for x in ['_source','node_modules','tools','.git']):continue
 tree=ET.parse(path);root=tree.getroot();changed=False
 for node in list(root):
  loc=node.find('{*}loc')
  if loc is not None and loc.text in localized:root.remove(node);changed=True
 if changed:ET.indent(tree,space='  ');tree.write(path,encoding='utf-8',xml_declaration=True)
root=ET.parse(ROOT/'sitemap.xml').getroot()
for url,rel in localized.items():
 s=BeautifulSoup((ROOT/rel).read_text(),'html.parser')
 el=ET.SubElement(root,'{'+NS+'}url');ET.SubElement(el,'{'+NS+'}loc').text=url
 # Only these pages changed; don't fabricate fresh dates for the rest of the site.
 ET.SubElement(el,'{'+NS+'}lastmod').text='2026-10-07'
 for a in s.select('link[rel="alternate"][hreflang]'):
  ET.SubElement(el,'{'+XH+'}link',{'rel':'alternate','hreflang':a['hreflang'],'href':a['href']})
tree=ET.ElementTree(root);ET.indent(tree,space='  ');tree.write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
print(f'Updated {len(localized)} localized canonical sitemap entries.')
