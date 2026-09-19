# Website validation

Reviewed 19 September 2026. This document distinguishes implementation checks from external account configuration and physical-device certification.

## Functional evidence

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
- 349 existing public H1Soft pages carry relevant static Nonogram navigation links. The internal Cleaner review page is intentionally excluded. Existing Cleaner icon changes published during development were preserved by rebasing onto the latest main branch.
- `scripts/verify-build.py` checks static asset/link existence, canonical/hreflang, metadata length, headings, alternative text, JSON-LD, prohibited product wording and bundle budgets.

## Size and performance

Final build audit: JavaScript **9,217 bytes gzip** including the lazy next puzzle; demo and next chunk together **7,185 bytes gzip**. Font files total **158,696 bytes**. Every 1600×900 city AVIF is below 34 KB. The real app video is 495,219 bytes, 35 seconds, with English/Korean captions and no audio.

Performance is measured with Lighthouse mobile simulation and saved as JSON in the local `reports/` directory. Scores can vary with the host, network, machine load and browser. Local runs reached English 99/100/100/100; the last Korean local run was 93/100/100/100, with zero blocking time and zero layout shift. The strict PRD LCP target of 1.8 seconds is not established by these local runs. Public-host measurements are recorded separately after deployment. Lab results are not real-user INP or Core Web Vitals field data.

## Deliberate release state

- Google Play and App Store listings have not been supplied or verified. The site says **coming soon** and offers the functional web puzzle. No download success is implied.
- Visitor analytics is disabled. DOM event hooks are ready; a real provider configuration and matching privacy update are needed before enabling transmission. No dashboard verification is claimed.
- The website puzzle is not persisted. Only user-selected language and dismissal of the Korean language suggestion use localStorage.
- No additional design assets are needed for this website release.

## Reproduction

```sh
npm ci
npm run check
npm test
npm run build
npm run test:build
node scripts/serve-built.mjs /path/to/h1soft.github.io
# In a second terminal:
SITE_PREVIEW_URL=http://127.0.0.1:8767 npm run test:browser
```

Browser testing requires Google Chrome and Playwright WebKit (`npx playwright install webkit`). Local reports and screenshots are excluded from the public source export. The native recording provenance is in `video-provenance.md`.
