#!/usr/bin/env python3
"""Keep Mongle's localized web test crawlable without running JavaScript."""
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import json
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://h1soft.github.io'
OUT = ROOT / 'mongle/play'
LOCALES = ['ko', 'en', 'ja', 'zh', 'zh-Hant', 'es', 'fr', 'de', 'pt', 'id', 'vi']
PAGES = {lang: '/mongle/play/' + ('' if lang == 'en' else lang + '/') for lang in LOCALES}
LANG = {lang: 'zh-Hans' if lang == 'zh' else lang for lang in LOCALES}
ALTERNATES = {LANG[lang]: BASE + route for lang, route in PAGES.items()}
ALTERNATES['x-default'] = BASE + '/mongle/play/'
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

def local_file(url):
    path = ROOT / urlsplit(url).path.lstrip('/')
    return path / 'index.html' if not path.suffix else path

manifest = json.loads((OUT / 'build-manifest.json').read_text())
require(manifest['pages'] == PAGES, 'manifest must contain the 11 stable language URLs')
for lang, route in PAGES.items():
    page = local_file(route)
    require(page.is_file(), f'{lang}: missing static HTML')
    if not page.is_file():
        continue
    soup = BeautifulSoup(page.read_text(), 'html.parser')
    initial = soup.select_one('#initial-locale')
    require(initial is not None and initial.get('data-locale') == lang, f'{lang}: initial locale')
    if initial is None:
        continue
    pack = json.loads(initial.string)
    canonical, seo = BASE + route, pack['seo']
    require(soup.html.get('lang') == LANG[lang], f'{lang}: HTML language')
    require(soup.title is not None and soup.title.get_text() == seo['title'], f'{lang}: localized title')
    tags = [('meta[name="description"]', 'content', seo['description']),
            ('link[rel="canonical"]', 'href', canonical),
            ('meta[property="og:url"]', 'content', canonical),
            ('meta[property="og:locale"]', 'content', seo['ogLocale']),
            ('meta[property="og:title"]', 'content', seo['title']),
            ('meta[property="og:description"]', 'content', seo['description'])]
    for selector, attribute, expected in tags:
        node = soup.select_one(selector)
        require(node is not None and node.get(attribute) == expected, f'{lang}: {selector}')
    links = soup.select('link[rel="alternate"][hreflang]')
    require(len(links) == 12 and {a['hreflang']: a['href'] for a in links} == ALTERNATES,
            f'{lang}: reciprocal canonical hreflang links')
    app = soup.select_one('#app')
    require(app is not None and len(app.select('h1')) == 1 and 'MBTI' in app.h1.get_text(),
            f'{lang}: static MBTI heading')
    guide = soup.select_one('#app .test-guide')
    copy = [seo['introTitle'], seo['introText']] + [item[key] for item in seo['details'] for key in ('title', 'text')]
    require(guide is not None and all(text in guide.get_text() for text in copy), f'{lang}: static localized guide')
    require({b['data-start'] for b in soup.select('#app button[data-start]')} == {'speed', 'precise'},
            f'{lang}: both test modes in HTML')
    require(len(soup.select('#app .test-languages a[href]')) == 11, f'{lang}: crawlable language links')
    require(not soup.select('meta[name="robots"][content*="noindex"]'), f'{lang}: noindex')
    for element in soup.select('script[src], link[href], meta[property="og:image"], meta[name="twitter:image"]'):
        url = urljoin(canonical, element.get('src') or element.get('href') or element.get('content'))
        if urlsplit(url).netloc == 'h1soft.github.io':
            require(local_file(url).is_file(), f'{lang}: missing asset or alternate {url}')
    require(local_file(manifest['locales'][lang]).is_file(), f'{lang}: missing locale JSON')

entries = ET.fromstring((OUT / 'sitemap.xml').read_text()).findall('{*}url')
require(len(entries) == 11 and {e.find('{*}loc').text for e in entries} == {BASE+p for p in PAGES.values()},
        'sitemap must contain exactly the 11 canonical test pages')
for entry in entries:
    links = entry.findall('{*}link')
    require(len(links) == 12 and {a.attrib['hreflang']: a.attrib['href'] for a in links} == ALTERNATES,
            'sitemap reciprocal language links')
require('Sitemap: ' + BASE + '/mongle/play/sitemap.xml' in (ROOT / 'robots.txt').read_text(),
        'robots.txt must declare the test sitemap')
for name in manifest['files']:
    require((OUT / name).is_file(), f'missing generated file: {name}')
print(json.dumps({'pages': len(PAGES), 'revision': manifest['revision'], 'errors': errors}, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
