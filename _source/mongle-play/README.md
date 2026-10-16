# Mongle web test

Static, client-only adaptation of the Mongle mobile test. Build with `node _source/mongle-play/build.mjs` from the repository root. Output is `/mongle/play/`.

- Korean, English, Japanese, Simplified/Traditional Chinese, Spanish, French, German, Portuguese, Indonesian, Vietnamese.
- Native 12/40 questions, scoring, and 16 result descriptions.
- Each language has a statically rendered URL (`/mongle/play/` for English, `/mongle/play/ko/` for Korean, and so on). Language paths survive sharing, and older `?lang=` links still work. Answers are kept only in this browser; result URLs contain four percentages and mode, not answers.
- Characters are original font-free SVG outlines in one module, inserted with the view. No image request or decoder is needed per question.
- Subset WOFF2 fonts preserve supported original glyphs and use platform fallback for characters absent in the original fonts. See licenses.
- Content-hashed assets and a service worker scoped to `/mongle/play/`; it never intercepts sibling pages. Navigation checks the network and falls back to the cached shell for that language. Updates replace only `mongle-play-*` caches.
- Browser sharing falls back to link copy; PNG export uses the same bundled character.

The source is under `_source/mongle-play`; do not hand-edit the generated `/mongle/play` output.

SEO copy is in `seo.json`. The shared `home.js` renderer keeps static and interactive content identical. The test home stays focused on the two test cards; the explanatory SEO guide lives on separate `/mongle/play/<lang>/about/` pages (`renderAbout`, `about.html`) linked by one small text link, and language choice is the top selector only. The builder creates canonical/hreflang metadata for both page sets, WebPage/WebApplication JSON-LD, and `/mongle/play/sitemap.xml` (11 test + 11 about pages). Run `python3 tools/seo/check_mongle.py` after building. The site-wide enricher must not overwrite these builder-owned pages.

Visit analytics are opt-in via the shared consent gate. Only a sanitized path and neutral title are sent; quiz answers/results are never custom events. GA4 enhanced history/form/click measurement must remain disabled to avoid collecting client-side result transitions. `/ko/mongle/play/` is a builder-owned redirect to the canonical Korean `/mongle/play/ko/`; only canonical language pages appear in the sitemap.
