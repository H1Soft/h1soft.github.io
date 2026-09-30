#!/usr/bin/env python3
"""Keep service tab icons distinct from the hostname's H1Soft search favicon."""
from pathlib import Path
from collections import Counter
import argparse
import json
import re
import struct
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
COMPANY_ICON = '/assets/h1soft-appicon.png'
SERVICE_ICONS = {
    'qr-scanner': '/assets/app_icon.png',
    'seukscan': '/assets/seukscan-icon.png',
    'ongle': '/assets/ongle-icon.png',
    'mongle': '/assets/mongle/icon.png',
    'sudoku': '/assets/sudoku-release/icon.png',
    'sagak': '/assets/sagak-icon.png',
}
COMPANY_PAGES = {'index.html', 'en/index.html', '404.html', 'privacy/index.html',
                 'terms/index.html', 'analytics-privacy/index.html'}
ICON_RELS = {'icon', 'shortcut', 'apple-touch-icon', 'apple-touch-icon-precomposed'}


def normalize(text, href):
    """Replace only favicon links, leaving manifests and the rest of the head intact."""
    inserted = False
    tags = (f'<link rel="icon" type="image/png" sizes="512x512" href="{href}">\n'
            f'<link rel="apple-touch-icon" sizes="512x512" href="{href}">')

    def replace(match):
        nonlocal inserted
        link = BeautifulSoup(match[0], 'html.parser').link
        if not ICON_RELS.intersection(link.get('rel', [])):
            return match[0]
        if inserted:
            return ''
        inserted = True
        indent = match[1] or ''
        return indent + tags.replace('\n', '\n' + indent) + '\n'

    result = re.sub(r'(?m)(^[ \t]*)?<link\b[^>]*>[ \t]*(?:\r?\n)?', replace, text, flags=re.I)
    if not inserted:
        result = result.replace('</head>', tags + '\n</head>', 1)
    head, separator, body = result.partition('</head>')
    return re.sub(r'(?m)^[ \t]+$', '', head) + separator + body


def apply(root=ROOT, check=False):
    # These are existing approved 512px PNG assets, not newly drawn icons.
    for href in {COMPANY_ICON, *SERVICE_ICONS.values()}:
        raw = (root / href.lstrip('/')).read_bytes()
        assert raw[:8] == b'\x89PNG\r\n\x1a\n', href
        assert struct.unpack('>II', raw[16:24]) == (512, 512), href
    counts = Counter()
    changed = []
    for path in sorted(root.rglob('*.html')):
        rel = path.relative_to(root)
        if any(p.startswith('.') or p in {'_source', 'node_modules', 'tools'} for p in rel.parts):
            continue
        product = next((p for p in rel.parts if p in SERVICE_ICONS), None)
        if not product and rel.as_posix() not in COMPANY_PAGES:
            continue
        href = SERVICE_ICONS[product] if product else COMPANY_ICON
        text = path.read_text()
        result = normalize(text, href)
        counts[product or 'h1soft'] += 1
        if result != text:
            changed.append(rel.as_posix())
            if not check:
                path.write_text(result)
    return {'pages': dict(counts), 'changed': changed}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    report = apply(check=args.check)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(bool(args.check and report['changed']))
