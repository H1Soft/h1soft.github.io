import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SITE_PREVIEW_URL || 'http://127.0.0.1:8766';
const reportDir = path.resolve('reports');
const evidence: Record<string, unknown>[] = [];
const homes = [
  { lang: 'en', route: '/nonogram/' },
  { lang: 'ko', route: '/nonogram/ko/' },
];
const pages = homes.flatMap(({ lang, route }) =>
  ['', 'privacy/', 'terms/', 'support/'].map((slug) => ({ lang, route: route + slug, slug })),
);
const codes = ['icn', 'hkg', 'sin', 'dps', 'dxb', 'cai', 'ath', 'vce', 'cdg', 'kef', 'jfk', 'cuz'];

test.use({
  launchOptions: { channel: 'chrome' },
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
});
test.setTimeout(60_000);
test.beforeAll(async () => {
  await fs.mkdir(reportDir, { recursive: true });
});
test.afterEach(async ({}, info) => {
  const current = {
    name: info.title,
    status: info.status,
    durationMs: info.duration,
    errors: info.errors.map((e) => e.message),
  };
  const file = path.join(reportDir, 'site-functional.json');
  const previous = await fs
    .readFile(file, 'utf8')
    .then(JSON.parse)
    .catch(() => ({ tests: [], evidence: [] }));
  const tests = new Map((previous.tests || []).map((r: any) => [r.name, r]));
  tests.set(current.name, current);
  const merged = new Map((previous.evidence || []).map((r: any) => [r.name, r]));
  for (const row of evidence) merged.set(row.name, row);
  await fs.writeFile(
    file,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        base,
        tests: [...tests.values()],
        evidence: [...merged.values()],
      },
      null,
      2,
    ),
  );
});

async function open(page: Page, route: string) {
  const response = await page.goto(base + route, { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
}
async function loadVisibleImages(page: Page) {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += Math.max(500, innerHeight - 120)) {
      scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 65));
    }
    await Promise.all(
      [...document.images]
        .filter((i) => i.getAttribute('src') && i.getBoundingClientRect().width > 0)
        .map((i) => i.decode().catch(() => {})),
    );
    scrollTo({ top: 0, behavior: 'instant' });
  });
}

for (const { lang, route } of homes) {
  test(`${lang}: all twelve city tabs have keyboard focus, local colour and a single panel`, async ({
    page,
  }) => {
    await open(page, route);
    const before = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      ink: getComputedStyle(document.documentElement).getPropertyValue('--ink'),
      grid: document.querySelector('[data-demo-grid]')?.innerHTML,
    }));
    await page.locator('#route').scrollIntoViewIfNeeded();
    await page.locator('#tab-icn').focus();
    const palettes: string[] = [];
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (i) await page.keyboard.press('ArrowRight');
      const selected = page.locator('#tab-' + code);
      await expect(selected).toBeFocused();
      await expect(selected).toHaveAttribute('aria-selected', 'true');
      await expect(selected).toHaveAttribute('tabindex', '0');
      await expect(page.locator('.city-tabs [tabindex="0"]')).toHaveCount(1);
      await expect(page.locator('.city-panel:visible')).toHaveCount(1);
      await expect(page.locator('#city-' + code)).toBeVisible();
      await expect(page.locator('#route')).toHaveAttribute('data-city', code);
      await expect
        .poll(() =>
          page
            .locator('#city-' + code + ' img')
            .evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
        )
        .toBe(true);
      palettes.push(
        await page
          .locator('#route')
          .evaluate((el) => getComputedStyle(el).getPropertyValue('--c1').trim()),
      );
    }
    expect(new Set(palettes).size).toBe(12);
    await page.keyboard.press('Home');
    await expect(page.locator('#tab-icn')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('#tab-cuz')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-icn')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#tab-cuz')).toBeFocused();
    expect(
      await page.locator('#tab-cuz').evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe('none');
    const after = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      ink: getComputedStyle(document.documentElement).getPropertyValue('--ink'),
      grid: document.querySelector('[data-demo-grid]')?.innerHTML,
    }));
    expect(after).toEqual(before);
    evidence.push({ name: `${lang} city palettes`, palettes });
  });

  test(`${lang}: manual development, three hint stages, FAQ and photo flip work with keys`, async ({
    page,
  }) => {
    await open(page, route);
    const slider = page.locator('#develop-range');
    await slider.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await expect(slider).toHaveValue('99');
    await expect(page.locator('#develop-value')).toHaveText('99%');
    await page.locator('#try').scrollIntoViewIfNeeded();
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await expect(slider).toHaveValue('99');
    await page.locator('#hint-tab-0').focus();
    for (let i = 0; i < 3; i++) {
      if (i) await page.keyboard.press('ArrowRight');
      await expect(page.locator('#hint-tab-' + i)).toBeFocused();
      await expect(page.locator('#hint-tab-' + i)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#hint-panel-' + i)).toBeVisible();
      await expect(page.locator('.hint-panel:visible')).toHaveCount(1);
    }
    await page.keyboard.press('Home');
    await expect(page.locator('#hint-tab-0')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('#hint-tab-2')).toBeFocused();
    const photo = page.locator('.flip-photo');
    await photo.focus();
    await page.keyboard.press('Space');
    await expect(photo).toHaveAttribute('aria-pressed', 'true');
    await expect(photo.locator('.photo-front')).toHaveAttribute('aria-hidden', 'true');
    await expect(photo.locator('.photo-back')).toHaveAttribute('aria-hidden', 'false');
    await page.keyboard.press('Enter');
    await expect(photo).toHaveAttribute('aria-pressed', 'false');
    const details = page.locator('.faq-list details');
    expect(await details.count()).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < (await details.count()); i++) {
      const item = details.nth(i);
      await item.locator('summary').focus();
      await page.keyboard.press('Enter');
      await expect(item).toHaveJSProperty('open', true);
      await expect(item.locator('p')).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(item).toHaveJSProperty('open', false);
    }
  });

  test(`${lang}: reduced motion starts development at fifty and disables automatic city cycling`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, route);
    await page.locator('#develop-range').scrollIntoViewIfNeeded();
    await expect(page.locator('#develop-range')).toHaveValue('50');
    await expect(page.locator('#develop-value')).toHaveText('50%');
    await page.locator('#route').scrollIntoViewIfNeeded();
    await page.waitForTimeout(4750);
    await expect(page.locator('#route')).toHaveAttribute('data-city', 'icn');
    await expect(page.locator('#develop-range')).toHaveValue('50');
  });

  test(`${lang}: mobile sticky action leaves keyboard focus and footer links unobscured`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, route);
    const sticky = page.locator('.mobile-sticky');
    await expect(sticky).toBeHidden();
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await expect(sticky).toBeVisible();
    await page.locator('.faq-list summary').first().focus();
    const checks: unknown[] = [];
    for (let i = 0; i < 14; i++) {
      const state = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const r = el.getBoundingClientRect();
        const x = Math.max(1, Math.min(innerWidth - 1, r.x + r.width / 2));
        const y = r.y + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        return {
          text: el.innerText.slice(0, 90),
          tag: el.tagName,
          y,
          bottom: r.bottom,
          unobscured: y >= 0 && y <= innerHeight && !!hit && (hit === el || el.contains(hit)),
        };
      });
      checks.push(state);
      await page.keyboard.press('Tab');
    }
    evidence.push({ name: `${lang} mobile keyboard occlusion`, checks });
    expect(checks.filter((x: any) => !x.unobscured)).toEqual([]);
    await page.evaluate(() =>
      scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    );
    const footerFit = await page.locator('.site-footer a').evaluateAll((nodes) => {
      const bar = document.querySelector('.mobile-sticky')!.getBoundingClientRect();
      return nodes.map((el) => ({
        text: el.textContent?.trim(),
        bottom: el.getBoundingClientRect().bottom,
        aboveBar: el.getBoundingClientRect().bottom <= bar.top,
      }));
    });
    evidence.push({ name: `${lang} footer occlusion`, checks: footerFit });
    expect(footerFit.every((x) => x.aboveBar)).toBe(true);
    await sticky.locator('a').click();
    await expect(sticky).toBeHidden();
    await expect(page).toHaveURL(new RegExp('/nonogram/(ko/)?#try$'));
  });

  test(`${lang}: JavaScript-disabled page retains static clues, content and native FAQ`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await open(page, route);
    await expect(page.locator('.demo-columns [data-clue-column]')).toHaveCount(5);
    await expect(page.locator('.demo-rows [data-clue-row]')).toHaveCount(5);
    await expect(page.locator('[role=gridcell]')).toHaveCount(25);
    expect((await page.locator('.demo-columns').textContent())?.trim()).toBeTruthy();
    await expect(page.locator('[data-demo-tool="fill"]')).toBeDisabled();
    await expect(page.locator('#city-icn')).toBeVisible();
    const faq = page.locator('.faq-list details').first();
    await faq.locator('summary').click();
    await expect(faq).toHaveJSProperty('open', true);
    await expect(page.locator('noscript')).not.toHaveCount(0);
    await context.close();
  });
}

test('Korean language suggestion is optional, paired and remembers a dismissal or choice', async ({
  browser,
}) => {
  const context = await browser.newContext({
    locale: 'ko-KR',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await open(page, '/nonogram/');
  const banner = page.locator('[data-locale-banner]');
  await expect(banner).toBeVisible();
  await expect(banner.locator('a')).toHaveAttribute('href', '/nonogram/ko/');
  expect(await banner.evaluate((el) => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
  await banner.locator('button').click();
  await expect(banner).toBeHidden();
  await open(page, '/nonogram/privacy/');
  await expect(banner).toBeHidden();
  await page.evaluate(() => localStorage.removeItem('nonogram-language-banner-dismissed'));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(banner).toBeVisible();
  await expect(banner.locator('a')).toHaveAttribute('href', '/nonogram/ko/privacy/');
  await banner.locator('a').click();
  await expect(page).toHaveURL(base + '/nonogram/ko/privacy/');
  expect(await page.evaluate(() => localStorage.getItem('nonogram-language'))).toBe('ko');
  await open(page, '/nonogram/');
  await expect(banner).toBeHidden();
  await context.close();
  const english = await browser.newContext({ locale: 'en-US' });
  const englishPage = await english.newPage();
  await open(englishPage, '/nonogram/');
  await expect(englishPage.locator('[data-locale-banner]')).toBeHidden();
  await english.close();
});

test('city rotation stops permanently after the first intentional interaction', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page, '/nonogram/');
  await page.locator('#route').scrollIntoViewIfNeeded();
  await expect(page.locator('#route')).not.toHaveAttribute('data-city', 'icn', { timeout: 6500 });
  await page.locator('#tab-ath').focus();
  await expect(page.locator('#route')).toHaveAttribute('data-city', 'ath');
  await page.waitForTimeout(4800);
  await expect(page.locator('#route')).toHaveAttribute('data-city', 'ath');
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await page.locator('#route').scrollIntoViewIfNeeded();
  await page.waitForTimeout(4800);
  await expect(page.locator('#route')).toHaveAttribute('data-city', 'ath');
});

test('all eight pages have paired translations, canonical metadata and valid internal destinations', async ({
  page,
  request,
}) => {
  const sections: Record<string, string[]> = {};
  const links = new Set<string>();
  for (const item of pages) {
    await open(page, item.route);
    await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://h1soft.github.io' + item.route,
    );
    const slug = item.slug;
    for (const lang of ['en', 'ko', 'x-default']) {
      const expected = 'https://h1soft.github.io/nonogram/' + (lang === 'ko' ? 'ko/' : '') + slug;
      await expect(page.locator(`link[rel=alternate][hreflang="${lang}"]`)).toHaveAttribute(
        'href',
        expected,
      );
    }
    const switcher = page
      .locator('.language a')
      .filter({ hasText: item.lang === 'en' ? 'KO' : 'EN' });
    await expect(switcher).toHaveAttribute(
      'href',
      '/nonogram/' + (item.lang === 'en' ? 'ko/' : '') + slug,
    );
    if (slug)
      sections[item.lang + '/' + slug] = await page
        .locator('.legal-content section')
        .evaluateAll((nodes) => nodes.map((n) => n.id));
    for (const href of await page
      .locator('a[href]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')!))) {
      if (href.startsWith('/') || href.startsWith('#'))
        links.add(
          new URL(href, base + item.route).pathname + new URL(href, base + item.route).hash,
        );
    }
  }
  for (const slug of ['privacy/', 'terms/', 'support/'])
    expect(sections['en/' + slug]).toEqual(sections['ko/' + slug]);
  const checked: unknown[] = [];
  for (const destination of links) {
    const [route, hash] = destination.split('#');
    const response = await request.get(base + route);
    expect(response.status(), destination).toBe(200);
    if (hash) {
      const html = await response.text();
      expect(html, destination).toMatch(new RegExp(`id=["']${hash}["']`));
    }
    checked.push({ destination, status: response.status() });
  }
  evidence.push({ name: 'paired legal sections and internal links', sections, checked });
});

for (const theme of ['light', 'dark'] as const)
  for (const item of pages) {
    test(`axe ${theme}: ${item.route}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await open(page, item.route);
      await loadVisibleImages(page);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      evidence.push({
        name: `axe ${theme} ${item.route}`,
        violations: result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            html: n.html,
            summary: n.failureSummary,
          })),
        })),
        incomplete: result.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
        passes: result.passes.length,
      });
      expect(
        result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          targets: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    });
  }

for (const theme of ['light', 'dark'] as const) {
  test(`key city palettes pass contrast: ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' });
    await open(page, '/nonogram/');
    const checks = [];
    for (const city of ['icn', 'ath', 'dxb', 'kef']) {
      await page.locator('#tab-' + city).focus();
      const panel = page.locator('#city-' + city);
      await panel.evaluate(async (el) => {
        await Promise.all(
          el
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished.catch(() => {})),
        );
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await expect(panel).toHaveCSS('opacity', '1');
      const result = await new AxeBuilder({ page })
        .include('#route')
        .withRules(['color-contrast'])
        .analyze();
      const rendered = await panel.evaluate((el) => ({
        opacity: getComputedStyle(el).opacity,
        ticketInk: getComputedStyle(el.querySelector('.photo-ticket')!).color,
        ticketPaper: getComputedStyle(el.querySelector('.photo-ticket')!).backgroundColor,
      }));
      checks.push({
        city,
        rendered,
        violations: result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
        })),
        incomplete: result.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      });
    }
    evidence.push({ name: `key city contrast ${theme}`, checks });
    expect(checks.filter((c) => c.violations.length)).toEqual([]);
  });
}

test('desktop and mobile full-page evidence loads lazy artwork before capture', async ({
  browser,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ])
    for (const theme of ['light', 'dark'] as const)
      for (const home of homes) {
        const context = await browser.newContext({
          viewport,
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await open(page, home.route);
        await loadVisibleImages(page);
        await page.screenshot({
          path: path.join(reportDir, `site-${home.lang}-${theme}-${viewport.width}-full.png`),
          fullPage: true,
        });
        const state = await page.evaluate(() => ({
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          images: [...document.images]
            .filter((i) => i.getAttribute('src') && i.getBoundingClientRect().width > 0)
            .map((i) => ({
              src: i.getAttribute('src'),
              complete: i.complete,
              width: i.naturalWidth,
            })),
        }));
        evidence.push({ name: `full-page ${home.lang} ${theme} ${viewport.width}`, ...state });
        expect(state.documentWidth).toBe(state.width);
        expect(state.images.filter((i) => !i.complete || i.width === 0)).toEqual([]);
        await context.close();
      }
});
