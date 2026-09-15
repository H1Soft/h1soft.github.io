#!/usr/bin/env python3
"""Build crawlable localized Phone Cleaner pages from reviewed text catalogs.

Requires beautifulsoup4. No browser language redirects or runtime translation.
English/Korean source layouts and all other H1Soft products remain independent.
"""
from pathlib import Path
from urllib.parse import urlsplit, urljoin
import json
import re
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup, Comment

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
ORIGIN = 'https://h1soft.github.io'
BASE = ORIGIN + '/cleaner/'
REV = '20260915-fe51859c5f'
LANGUAGES = {
    'de': 'Deutsch', 'en': 'English', 'es': 'Español', 'fa': 'فارسی',
    'fr': 'Français', 'id': 'Bahasa Indonesia', 'it': 'Italiano',
    'nl': 'Nederlands', 'pl': 'Polski', 'pt': 'Português', 'ru': 'Русский',
    'tr': 'Türkçe', 'vi': 'Tiếng Việt', 'zh-CN': '简体中文',
    'zh-TW': '繁體中文', 'ko': '한국어', 'ja': '日本語',
}
SOURCE = json.loads((HERE / 'source.json').read_text())
KEYS = {v: k for k, v in SOURCE.items()}
KO = {
    's251': '웹사이트 언어 선택', 's252': '17개 언어',
    's253': '폰 클리너 — 중복 사진·동영상·저장 공간 정리 | H1Soft',
    's254': '중복 사진은 모아 보고, 큰 사진과 동영상은 비교해서 줄여요. 안 쓰는 앱과 큰 파일까지 직접 골라 정리하는 Android 폰 클리너. 사진은 기기 안에서만 처리해요.',
    's255': '남길 사진을 고르는 순간부터, 다시 꺼내는 순간까지.',
    's256': 'Android 앱', 's257': '폰 클리너 웹사이트', 's258': '개인정보 및 약관',
}

def route(code, kind='home'):
    return '/cleaner/' + ('' if code == 'ko' else code + '/') + ('' if kind == 'home' else kind + '/')

def catalog(code):
    if code == 'en': return SOURCE
    if code == 'ko': return KO
    data = json.loads((HERE / 'locales' / f'{code}.json').read_text())
    assert set(data) == set(SOURCE), (code, 'translation keys differ')
    assert all(isinstance(v, str) and v.strip() for v in data.values()), code
    return data

def replace_text(soup, data):
    for node in list(soup.find_all(string=True)):
        if isinstance(node, Comment) or node.parent.name in ('script', 'style'): continue
        old = str(node); key = KEYS.get(old.strip())
        if key:
            pre = old[:len(old) - len(old.lstrip())]
            post = old[len(old.rstrip()):]
            node.replace_with(pre + data[key] + post)
    for tag in soup.find_all(True):
        for attr in ('alt', 'aria-label'):
            value = tag.get(attr, '').strip()
            if value in KEYS: tag[attr] = data[KEYS[value]]
    for tag in soup.select('meta[name="description"]'):
        tag['content'] = data[KEYS[tag['content']]]

def language_picker(soup, code, kind, data):
    picker = soup.select_one('.qr-language-picker')
    picker.select_one('summary')['aria-label'] = data['s251']
    picker.select_one('summary span').string = LANGUAGES[code]
    picker.select_one('.qr-language-heading').string = data['s251']
    picker.select_one('.qr-language-count').string = data['s252']
    nav = picker.select_one('.qr-language-grid'); nav.clear(); nav['aria-label'] = data['s251']
    for language, name in LANGUAGES.items():
        link = soup.new_tag('a', href=route(language, kind), hreflang=language, lang=language)
        link['class'] = 'qr-language-option'
        if language == code: link['aria-current'] = 'page'
        label = soup.new_tag('bdi', dir='rtl' if language == 'fa' else 'ltr')
        label.string = name; link.append(label)
        if language == code:
            tick = soup.new_tag('span'); tick['aria-hidden'] = 'true'; tick.string = '✓'; link.append(tick)
        nav.append(link)

def metadata(soup, code, kind, data):
    head = soup.head; url = ORIGIN + route(code, kind)
    for tag in head.select('link[rel="canonical"],link[rel="alternate"],script[type="application/ld+json"],meta[property^="og:"],meta[name^="twitter:"]'):
        tag.decompose()
    if kind == 'home':
        soup.title.string = data['s253']
        soup.select_one('meta[name="description"]')['content'] = data['s254']
    title = soup.title.get_text(); desc = soup.select_one('meta[name="description"]')['content']
    head.append(soup.new_tag('link', rel='canonical', href=url))
    for language in list(LANGUAGES) + ['x-default']:
        head.append(soup.new_tag('link', rel='alternate', hreflang=language,
                                href=ORIGIN + route('ko' if language == 'x-default' else language, kind)))
    image = BASE + f'assets/app-icon-{REV}.webp'
    locales = {'en':'en_US','ko':'ko_KR','de':'de_DE','es':'es_ES','fa':'fa_IR','fr':'fr_FR','id':'id_ID','it':'it_IT','nl':'nl_NL','pl':'pl_PL','pt':'pt_BR','ru':'ru_RU','tr':'tr_TR','vi':'vi_VN','zh-CN':'zh_CN','zh-TW':'zh_TW','ja':'ja_JP'}
    og = {'type':'website','site_name':'H1Soft','title':title,'description':desc,
          'url':url,'image':image,'image:width':'512','image:height':'512',
          'image:alt': ('폰 클리너 아이콘' if code == 'ko' else data['s097']), 'locale':locales[code]}
    for key,value in og.items(): head.append(soup.new_tag('meta', property='og:'+key, content=value))
    for language in LANGUAGES:
        if language != code: head.append(soup.new_tag('meta', property='og:locale:alternate', content=locales[language]))
    for key,value in {'card':'summary','title':title,'description':desc,'image':image,'image:alt':og['image:alt']}.items():
        head.append(soup.new_tag('meta', attrs={'name':'twitter:'+key,'content':value}))
    publisher = {'@type':'Organization','name':'H1Soft','url':ORIGIN+'/'}
    page = {'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':desc,
            'inLanguage':code,'dateModified':'2026-09-15','publisher':publisher}
    graph = [page]
    if kind == 'home':
        app = {'@type':'SoftwareApplication','@id':url+'#app','name':'폰 클리너' if code=='ko' else 'Phone Cleaner',
               'applicationCategory':'UtilitiesApplication','operatingSystem':'Android 11+',
               'url':url,'image':image,'description':desc,'inLanguage':code,'publisher':publisher,
               'featureList':[n.get_text(' ',strip=True) for n in soup.select('.features h3')]}
        page['mainEntity'] = {'@id':url+'#app'}; graph.append(app)
    else:
        graph.append({'@type':'BreadcrumbList','itemListElement':[
            {'@type':'ListItem','position':1,'name':'폰 클리너' if code=='ko' else 'Phone Cleaner','item':ORIGIN+route(code)},
            {'@type':'ListItem','position':2,'name':soup.h1.get_text(),'item':url}]})
    script = soup.new_tag('script', type='application/ld+json')
    script.string = json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('</','<\\/')
    head.append(script)

def render(code, kind):
    data = catalog(code)
    template = HERE / 'templates' / ((f'ko-{kind}.html.in') if code=='ko' else f'{kind}.html.in')
    soup = BeautifulSoup(template.read_text(), 'html.parser')
    if code not in ('en','ko'): replace_text(soup, data)
    soup.html['lang'] = code; soup.html['dir'] = 'rtl' if code=='fa' else 'ltr'
    # English template links resolve first, then map product-local destinations.
    old_base = BASE + ('' if code=='ko' else 'en/') + ('' if kind=='home' else kind+'/')
    for tag in soup.find_all(True):
        for attr in ('src','href'):
            value = tag.get(attr)
            if not value or value.startswith(('#','mailto:','data:')): continue
            resolved = urlsplit(urljoin(old_base, value))
            if resolved.netloc != 'h1soft.github.io': continue
            path = resolved.path
            if path.startswith('/cleaner/'):
                tail = path.removeprefix('/cleaner/')
                tail = re.sub(r'^en/', '', tail)
                if tail in ('','index.html','privacy/','privacy/index.html','terms/','terms/index.html'):
                    local_kind = 'privacy' if tail.startswith('privacy') else 'terms' if tail.startswith('terms') else 'home'
                    path = route(code, local_kind)
                else: path = '/cleaner/' + tail
                path = re.sub(r'(app-icon|favicon)-20260914(?:-final|-eb3c9f63bc)?\.(webp|png)',rf'\1-{REV}.\2',path)
                # Stable CSS/JS URLs are versioned to prevent mixed old/new interactions.
                query = '?v=20260915-i18n' if path.endswith(('.css','.js')) else ''
                tag[attr] = path + query + ('#'+resolved.fragment if resolved.fragment else '')
            elif path.startswith('/en/') and code not in ('en','ko'):
                candidate = '/' + code + '/' + path.removeprefix('/en/')
                if (ROOT / candidate.lstrip('/')).is_file(): tag[attr] = candidate + ('#'+resolved.fragment if resolved.fragment else '')
    own = soup.select_one('.nav-item img[src*="app-icon"]').parent
    own['lang'] = code; own['hreflang'] = code
    language_picker(soup, code, kind, data)
    if code != 'ko':
        face = code if code in ('fa','ja','zh-CN','zh-TW') else 'latin'
        preload = soup.select_one('link[rel="preload"][as="font"]')
        preload['href'] = f'/cleaner/assets/fonts/{face}.woff2'
        preload['type'] = 'font/woff2'
    if kind == 'home':
        soup.select_one('.section-description').string = data['s255']
        for img in soup.select('.hero-phone,.screen-card img,#dialog-image'):
            name = Path(urlsplit(img['src']).path).name
            img['src'] = f'/cleaner/assets/screens/{code}/{name}'
        # Explicit dimensions prevent layout shifts before image decoding.
        for img in soup.select('.screen-card img,#dialog-image'):
            img['width']='720'; img['height']='1280'
    metadata(soup, code, kind, data)
    # Shared locale layout fixes, loaded after the original design styles.
    soup.head.append(soup.new_tag('link', rel='stylesheet', href='/cleaner/i18n.css?v=20260915'))
    for tag in soup.select('[viewbox]'):
        tag['viewBox'] = tag.attrs.pop('viewbox')
    output = ROOT / route(code, kind).lstrip('/') / 'index.html'
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(str(soup).rstrip()+'\n')
    return route(code, kind)

def sitemaps(paths):
    ns='http://www.sitemaps.org/schemas/sitemap/0.9'; xhtml='http://www.w3.org/1999/xhtml'
    ET.register_namespace('',ns); ET.register_namespace('xhtml',xhtml)
    for name in ('sitemap.xml','sitemap-1.xml'):
        tree=ET.parse(ROOT/name); root=tree.getroot()
        for item in list(root):
            loc=item.find('{'+ns+'}loc')
            if loc is not None and loc.text.startswith(BASE): root.remove(item)
        for code,kind,path in paths:
            item=ET.SubElement(root,'{'+ns+'}url')
            ET.SubElement(item,'{'+ns+'}loc').text=ORIGIN+path
            ET.SubElement(item,'{'+ns+'}lastmod').text='2026-09-15'
            for language in list(LANGUAGES)+['x-default']:
                ET.SubElement(item,'{'+xhtml+'}link',rel='alternate',hreflang=language,href=ORIGIN+route('ko' if language=='x-default' else language,kind))
        ET.indent(tree,space='  ');tree.write(ROOT/name,encoding='utf-8',xml_declaration=True)

if __name__ == '__main__':
    paths=[(code,kind,render(code,kind)) for code in LANGUAGES for kind in ('home','privacy','terms')]
    sitemaps(paths)
    (HERE/'pages.json').write_text(json.dumps([p for _,_,p in paths],indent=2)+'\n')
    print(f'Built {len(paths)} pages in {len(LANGUAGES)} languages; updated both sitemaps.')
