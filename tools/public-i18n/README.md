# Public landing-page localization

Four landing pages × 17 locales = 68 static, independently crawlable pages.
The existing Korean homepage and Nonogram page are retained as native templates.
`id` is Indonesian (`In` in older Android locale lists); `zh-CN` and `zh-TW`
are Simplified and Traditional Chinese. Portuguese uses Brazilian store links.
Persian pages use RTL; Apple has no Persian metadata locale, so App Store links
use the US English storefront. Google Play supports `hl=fa`.

## Build and validate

Run from the repository root with Python 3.9+, Beautiful Soup, and Node 22+:

```sh
python3 tools/public-i18n/build.py
python3 tools/seo/product_links.py
node tools/localize-store-links.mjs
node tools/public-i18n/sitewide.mjs
python3 tools/seo/favicons.py
python3 tools/public-i18n/sitemap.py
python3 tools/public-i18n/check.py
python3 tools/seo/check.py
python3 tools/seo/product_links.py --check
python3 tools/seo/check_product_links.py
python3 tools/seo/favicons.py --check
node tools/localize-store-links.mjs --check
node --test tools/public-i18n/store-links.test.mjs
```

`templates/*.html.template` are the editable landing-page snapshots. `locales/`
contains the copy keyed by the stable IDs in `inventory.json`. Regenerate the
inventory with `prepare.py` after changing source copy, then complete the new
translations before building. The build fails when template text is missing.
Do not hand-edit generated localized HTML.

Nonogram's Astro source remains in `_source/nonogram`. After rebuilding its
English/Korean HTML, refresh the matching two templates and run this pipeline;
otherwise a standalone Astro export will overwrite its two generated pages.
Keep asset paths in these templates synchronized with Astro's hashed filenames.

`home-editorial.json` supplies complete sentences instead of concatenating
translated headline fragments. `attachment-editorial.json` supplies reviewed
search descriptions, and `glossary.json` resolves ambiguous meanings such as
attachment (a relationship style, not a file attachment) and plush (a toy, not
luxury). Character names and matching interface strings reuse the app's shipped
locale files. The Korean originals remain unchanged in their native templates.
`assemble.py` is an optional draft-import utility; deployed pages never call an
external translation service. Drafts are ignored by Git. Copy was AI-reviewed,
not certified by native-language editors.

## Navigation and SEO contracts

- Every landing page has its own canonical URL, 17 reciprocal hreflang links,
  an English x-default, translated metadata and structured data.
- Language menus are native `<details>` links and work without JavaScript.
- Language switches preserve section hashes. There are no forced locale redirects.
- Product links use the site's existing locale-aware product catalog.
- Canonical landing URLs live in the root sitemap. The sitemap tool removes
  obsolete copies from other partitions and retains existing non-landing entries.
- Static store URLs and JSON-LD offer URLs are localized. The shared observer
  also localizes links created or changed after load, including older pages.
- App availability, pricing, and store IDs are preserved. Unreleased Android
  apps remain unavailable; no invented store URLs are added.
- Existing legal documents, Korean character guides, and compatibility articles
  retain their original languages. They are not advertised as translated pages.
- Existing game screenshots and design previews retain their original artwork.

Checks cover all 68 language pages, assets and internal destinations, reciprocal
hreflang, canonical URLs, sitemap inclusion, RTL, missing copy, substitution
variables, and store URL behavior. Existing SEO, favicon, product-link and
analytics checks remain in use.
