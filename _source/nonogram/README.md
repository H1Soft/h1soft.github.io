# Nonogram Trip website

Official English/Korean site at **https://h1soft.github.io/nonogram/**, with the Korean homepage at **/nonogram/ko/**.

Astro 7 static HTML, CSS and small TypeScript modules. No client UI framework. The supplied WINDOW SEAT / WEB 06 design is the visual authority; the system preference selects light or night-flight appearance.

## Develop and verify

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
npm run check
npm test
```

`npm test` builds the current site and audits generated routes, assets, metadata and bundle budgets. Browser checks use installed Google Chrome and Playwright WebKit (`npx playwright install webkit`). Run a preview of the complete H1Soft hosting tree, then:

```sh
node scripts/serve-built.mjs /path/to/h1soft.github.io
SITE_PREVIEW_URL=http://127.0.0.1:8767 npm run test:browser
```

The site is intentionally based at `/nonogram`, including local previews. Test reports and screenshots stay in `reports/` and are not published. `docs/VALIDATION.md` records the verification and its limits.

## Publish

The H1Soft user repository already publishes the root of `main` through GitHub Pages. Preserve this setup and all other app directories.

1. Run the checks and `npm run build`.
2. Export the generated files: `node scripts/export-site.mjs /path/to/h1soft.github.io`.
3. Review the resulting `nonogram/` diff, commit, and push `main`.
4. Confirm the GitHub Pages deployment and the public English/Korean routes.

The hosting root must contain `.nojekyll` so `_astro` bundles are served. Domain-level `robots.txt` declares `/nonogram/sitemap.xml`; the main sitemap also lists the eight public Nonogram pages. The hosting root `404.html` handles unknown paths. `_source/nonogram` contains the reproducible source and is excluded from crawling.

## Product and configuration

- The introduction at `#home` presents the app with its illustrated background. `#route` explores twelve cities; `#collect` presents a static ICN/HKG/KEF photo gallery. The website does not include a playable puzzle, departure board or interactive photo flip.
- Language choice and a dismissed language suggestion are the only localStorage preferences.
- Store availability is centralized in `src/data/site.ts`. Both listings are **coming soon** until verified store URLs are supplied. Add official store badge assets and reviewed campaign links when activating the listings.
- No visitor analytics is enabled. Local `nonogram:event` hooks cover the remaining city, video, FAQ and store interactions. Connecting a provider requires real account configuration and a matching privacy notice.
- Legal/support content is in `src/data/legal.ts`; official contact is `h1.soft.x001@gmail.com`.
- Prepared AVIF/WebP assets and WOFF2 font subsets are included. Font licenses are in `public/fonts/licenses/`. No paid design service or third-party CDN is needed to render the site.
- `scripts/prepare-assets.py` is an optional authoring utility for the original native-app workspace; the included prepared assets are sufficient for normal builds. `scripts/create-social-images.mjs` creates the English/Korean share images against the local preview.

The 35-second video is an actual Android preview recording. Provenance and encoding details are in `docs/video-provenance.md`.

## Historical demo tests

The former browser demo engine and its tests are no longer part of the landing page or the default verification commands. Their September 19 results are historical and do not validate the current landing page. The previous source remains available in the release commit linked from `docs/VALIDATION.md`. Current browser coverage lives in `tests/site.spec.ts` and `tests/compatibility.spec.ts`.
