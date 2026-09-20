# Website validation

Updated 20 September 2026. This document distinguishes current verification from historical release evidence, external account configuration and physical-device certification.

## Current landing revision — 20 September 2026

The requested revision removes the playable browser demo, departure board and interactive photo flip. The introduction uses `#home`; `#route` and `#collect` remain. The collection section presents three real city illustrations (ICN, HKG and KEF) as a static album gallery.

**Local verification complete:** 36/36 browser checks passed against the exported build at `http://127.0.0.1:8767` on 20 September 2026. This verifies the revised local build; the historical public-release and Lighthouse results below are not claimed for this revision.

- `npm test` now builds and audits the current generated site. It excludes the historical demo engine tests.
- `npm run test:browser` runs `tests/site.spec.ts` and `tests/compatibility.spec.ts` only.
- `tests/site.spec.ts`: **34/34 Chromium checks passed**. Introduction/gallery layout at 320, 390, 768 and 1440px, decorative hero artwork, twelve city keyboard tabs and automatic-cycle stop, manual development range, three hint stages, FAQ, mobile focus visibility, locale preferences, paired legal routes and JavaScript-disabled static content. The removed demo, departure board and photo flip are absent. Evidence: `reports/site-functional.json`, revision `landing-gallery-2026-09-20`.
- Axe found **zero automatic violations** across all eight pages in both themes. Key city contrast checks also passed after transition completion. This does not replace a physical-device assistive-technology audit.
- Eight full-page screenshots were refreshed after lazy artwork decoded: English/Korean × light/dark × 1440/390px. No horizontal overflow or missing decoded images was detected. Files: `reports/site-{en,ko}-{light,dark}-{1440,390}-full.png`.
- `tests/compatibility.spec.ts`: **2/2 WebKit checks passed**, using Playwright WebKit 26.6 on macOS. English desktop and Korean mobile-layout dark mode cover fonts, static album images, city navigation, development slider and legal navigation, with no JavaScript/console/HTTP errors. This is mobile-layout emulation, not a physical iPhone test. Evidence: `reports/compatibility.json`.
- The corresponding static build audit reports zero errors and **1,857 bytes gzip** of generated JavaScript. Evidence: `reports/build-audit.json`.

## Historical functional evidence — 19 September 2026

The demo engine and demo test paths below refer to the previous release commit, not the current verification targets. The current revision removes that unused demo source and its tests.

- `tests/demo-engine.test.ts`: **8/8**. Exact PRD puzzle clues, independent unique-solution counting and line-only solving, grouped undo, cancellation, temporary tool inversion, axis locking and completion.
- `tests/demo.spec.ts`: **14/14** Chromium regressions. English/Korean touch and keyboard play, 5×5 and lazy-loaded 10×10 completion, long press, undo, error rings, narrow scrolling, reduced motion, no-script fallback and two concurrent-input races.
- `tests/site.spec.ts`: **32/32**. Twelve city tabs and persistent automatic-cycle stop, manual development range, hint steps, photo flip, FAQ, mobile focus visibility, language suggestion/preferences, paired metadata/routes, JavaScript-disabled content and full-page images.
- The site suite runs axe on eight pages in both themes: **zero automatically detected violations**. City text contrast was additionally calculated across all twelve palettes: minimum **6.13:1**.
- `tests/compatibility.spec.ts`: **2/2**, Playwright WebKit 26.6 (build 2359) on macOS. English desktop and Korean mobile-layout dark mode cover rendering, fonts, puzzle completion, city selection, slider and legal navigation.
- `astro check`: zero errors and warnings. The final static build completes successfully.

Chrome touch tests use browser emulation and native browser touch events. WebKit mobile layout is not a physical iPhone test. These results do not claim a completed physical-device VoiceOver/TalkBack audit.

## Content and SEO

- Eight English/Korean landing/privacy/terms/support URLs plus a noindex product 404.
- Absolute canonical links, reciprocal en/ko/x-default hreflang, localized descriptions, one H1 per page, and independent 1200×630 share images.
- SoftwareApplication information uses verified app features, free pricing and supported platforms. No fabricated rating, download count or install URL.
- FAQPage questions and answers come from the same data as the visible FAQ.
- XML sitemap, domain-level robots declaration and `.nojekyll`; domain root 404 contains working Nonogram routes.
- 349 existing public H1Soft pages carry relevant static Nonogram navigation links. The internal Cleaner review page is intentionally excluded. Existing Cleaner icon changes and four other apps’ newly released App Store links were preserved by rebasing onto the latest main branch.
- `scripts/verify-build.py` checks static asset/link existence, canonical/hreflang, metadata length, headings, alternative text, JSON-LD, prohibited product wording and bundle budgets.

## Historical size and performance — 19 September 2026

Previous build audit: JavaScript **9,217 bytes gzip** including the lazy next puzzle; demo and next chunk together **7,185 bytes gzip**. Font files total **158,696 bytes**. Every 1600×900 city AVIF is below 34 KB. The real app video is 495,219 bytes (MP4) with a 732,816-byte WebM alternative, 35 seconds, with English/Korean captions and no audio.

Performance is measured with Lighthouse mobile simulation and saved as JSON in the local `reports/` directory. Scores can vary with the host, network, machine load and browser. Local runs reached English 99/100/100/100; the last Korean local run was 93/100/100/100, with zero blocking time and negligible layout shift. The strict PRD LCP target of 1.8 seconds is not established by these local runs. Public-host measurements below supersede local runs for the deployed site. Lab results are not real-user INP or Core Web Vitals field data.

## Deliberate release state

- Google Play and App Store listings have not been supplied or verified. The site says **coming soon**. No download success is implied.
- Visitor analytics is disabled. DOM event hooks are ready; a real provider configuration and matching privacy update are needed before enabling transmission. No dashboard verification is claimed.
- The current landing revision has no playable website puzzle. Only user-selected language and dismissal of the Korean language suggestion use localStorage.
- No additional design assets are needed for this website release.

## Reproduction

```sh
npm ci
npm run check
npm test
node scripts/serve-built.mjs /path/to/h1soft.github.io
# In a second terminal:
SITE_PREVIEW_URL=http://127.0.0.1:8767 npm run test:browser
```

Browser testing requires Google Chrome and Playwright WebKit (`npx playwright install webkit`). Local reports and screenshots are excluded from the public source export. The native recording provenance is in `video-provenance.md`.

## Historical public release verification — 19 September 2026

Release commit: [`08d298c`](https://github.com/H1Soft/h1soft.github.io/commit/08d298cd05b5cb5f0eca1a3307c3abc84fbb0318).

- [GitHub Pages deployment](https://github.com/H1Soft/h1soft.github.io/actions/runs/35439007109): successful.
- [Source checks on Node 24](https://github.com/H1Soft/h1soft.github.io/actions/runs/35439008136): successful, including dependency installation, Astro checking, engine tests, static build and generated-file audit.
- Public HTTP audit: all eight product pages, 35 referenced assets, ten internal destinations, seven representative H1Soft pages and all three declared sitemaps respond correctly. A nonexistent product path returns an actual HTTP 404 with working H1Soft recovery links. Evidence: `reports/live-host-audit.json` (55 unique URLs).
- Six desktop/mobile browser checks across the product and company home pages found no JavaScript/HTTP errors or horizontal overflow. Images were visually checked after decoding. Evidence: `reports/live-browser.json` and `reports/live-*.png`.
- MP4 and WebM both decode and seek to 18 seconds in Chromium and WebKit, with exact 35-second duration and 720×1600 dimensions. No video-format request is sent before playback. Evidence: `reports/video-formats.json`.
- A final copy check removed advertising promises from the two company home pages’ Nonogram card, FAQ and structured descriptions, keeping them aligned with the product PRD.
- The same 14 browser puzzle regressions pass against `https://h1soft.github.io`, including both locales and 5×5/10×10 play. Evidence: local `reports/demo-live.json`.

### Historical Lighthouse on the public HTTPS host

Default Lighthouse mobile simulation, cold browser sessions, run sequentially on 19 September 2026. The English and Korean landing pages were measured independently; these are lab measurements, not a real-user guarantee.

| Page                   | Performance | Accessibility | Best practices | SEO |   LCP | Blocking time |   CLS |
| ---------------------- | ----------: | ------------: | -------------: | --: | ----: | ------------: | ----: |
| English `/nonogram/`   |         100 |           100 |            100 | 100 | 1.2 s |          0 ms | 0.008 |
| Korean `/nonogram/ko/` |          99 |           100 |            100 | 100 | 2.0 s |         40 ms |     0 |

Both measurements exceed the PRD performance score target of 95. The Korean measurement is 0.2 seconds above the stricter 1.8-second LCP target; that target is **not claimed as met for Korean**. Both runs have no Lighthouse run warnings. Full reports are retained locally as `reports/lighthouse-en-live.json` and `reports/lighthouse-ko-live.json`.
