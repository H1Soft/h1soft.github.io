# Phone Cleaner localization

The 17 language catalogs produce 51 static, crawlable pages: product, privacy,
and terms. Korean keeps `/cleaner/`; English is `/cleaner/en/`. Indonesian uses
`id`; Chinese uses `zh-CN` / `zh-TW`; `pt` copy is Brazilian Portuguese.

`source.json` gives each English HTML text node and accessibility label a stable
key. `locales/*.json` contains reviewed translations. The English and Korean
source layouts live in `templates/*.html.in`. Change these sources, then build:

```sh
python3 -m pip install beautifulsoup4
python3 tools/cleaner-i18n/build.py
python3 tools/cleaner-i18n/verify.py
```

The builder preserves the design, localized policy links and section anchors.
It writes self-canonicals, reciprocal hreflang links (17 + x-default), localized
titles/descriptions/Open Graph/Twitter cards and structured data, and updates
both root sitemaps. It does not use automatic language redirects or JavaScript
translation. The language picker works without JavaScript.

`cleaner/i18n.css` adds logical RTL layout and locally hosted subset fonts.
`cleaner/app.js` handles RTL gallery scrolling and arrow keys. Images under
`cleaner/assets/screens/{locale}/` reuse the approved localized campaign and
actual localized app captures in the original Galaxy S23 frame. The app-project
script `tool/export_website_locale_assets.py` exports those assets and fonts.

The privacy policy and terms retain their September 12, 2026 effective date;
translation does not introduce a new policy. App/platform limitations and
retention periods are preserved. Marketing copy does not claim guaranteed
savings, rankings, or performance improvements. Search volume was not estimated.

References:
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- https://developers.google.com/search/docs/specialty/international/localized-versions

Run `verify.py` for complete keys, 51 unique titles, all internal product links,
CSS assets/fonts, localized screenshots, legal section coverage, language
menus, canonical/hreflang, structured data, and sitemap coverage. A browser pass
must also check narrow/wide layouts and RTL gallery/policy navigation before
deployment; static checks alone do not establish visual correctness.
