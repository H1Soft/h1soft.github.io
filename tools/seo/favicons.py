#!/usr/bin/env python3
"""Use one H1Soft favicon across the hostname's public marketing pages."""
from pathlib import Path
from collections import Counter
import argparse
import json
import re
import struct
from bs4 import BeautifulSoup
from product_links import inventory

ROOT = Path(__file__).resolve().parents[2]
COMPANY_ICON = '/assets/h1soft-appicon.png'
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
    # Keep the established URL and approved asset so crawlers can refresh it.
    raw = (root / COMPANY_ICON.lstrip('/')).read_bytes()
    assert raw[:8] == b'\x89PNG\r\n\x1a\n', COMPANY_ICON
    assert struct.unpack('>II', raw[16:24]) == (512, 512), COMPANY_ICON
    counts = Counter()
    changed = []
    # Reuse the public-page boundary: exported apps, private flows and noindex
    # routes retain their own installation icons and manifests.
    pages, _, _ = inventory(root)
    for path, (_, text, product, _, _) in pages.items():
        rel = path.relative_to(root)
        result = normalize(text, COMPANY_ICON)
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
