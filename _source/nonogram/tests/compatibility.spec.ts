import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEMO_5 } from '../src/scripts/demo-engine';

// Uses Playwright's WebKit build on macOS, not a physical iPhone or shipping Safari.
// SITE_PREVIEW_URL=http://127.0.0.1:8767 npx playwright test tests/compatibility.spec.ts --workers=1
const base = process.env.SITE_PREVIEW_URL || 'http://127.0.0.1:8767';
const evidence: Record<string, unknown>[] = [];
test.use({ browserName: 'webkit' });
test.setTimeout(60_000);

for (const scenario of [
  { lang: 'en', viewport: { width: 1440, height: 1000 }, colorScheme: 'light', mobile: false },
  { lang: 'ko', viewport: { width: 390, height: 844 }, colorScheme: 'dark', mobile: true },
] as const) {
  test(`WebKit ${scenario.lang}: layout, fonts, puzzle, city, development and legal navigation`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      colorScheme: scenario.colorScheme,
      locale: scenario.lang === 'ko' ? 'ko-KR' : 'en-US',
      isMobile: scenario.mobile,
      hasTouch: scenario.mobile,
      reducedMotion: scenario.mobile ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && response.url().startsWith(base))
        errors.push(`${response.status()} ${response.url()}`);
    });
    const home = '/nonogram/' + (scenario.lang === 'ko' ? 'ko/' : '');
    const response = await page.goto(base + home, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-nonogram-demo]')).toHaveAttribute('data-ready', 'true');
    const fonts = await page.evaluate(async (lang) => {
      const families = [
        'Newsreader',
        'Jakarta',
        'JetBrains',
        ...(lang === 'ko' ? ['Pretendard'] : []),
      ];
      const loaded = [];
      for (const family of families) {
        const faces = await document.fonts.load(
          `500 16px ${family}`,
          family === 'Pretendard' ? '퍼즐 하나가' : 'Nonogram 192',
        );
        loaded.push({
          family,
          faces: faces.map((face) => ({ status: face.status, weight: face.weight })),
        });
      }
      await document.fonts.ready;
      return loaded;
    }, scenario.lang);
    expect(
      fonts.every(
        (font) => font.faces.length > 0 && font.faces.every((face) => face.status === 'loaded'),
      ),
    ).toBe(true);
    const fit = async () =>
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    await fit();
    for (const [index, value] of DEMO_5.solution.flat().entries()) {
      if (!value) continue;
      await page.locator(`[data-cell="${index}"]`).focus();
      await page.keyboard.press('Space');
    }
    await expect(page.locator('[data-nonogram-demo]')).toHaveAttribute('data-phase', 'complete');
    await expect(page.locator('[data-demo-result-title]')).toHaveText(
      scenario.lang === 'ko' ? '종이비행기' : 'Paper plane',
    );
    await expect(page.locator('[data-demo-result-title]')).toBeFocused();
    await fit();
    await page.locator('#tab-icn').focus();
    await page.keyboard.press('End');
    await expect(page.locator('#tab-cuz')).toBeFocused();
    await expect(page.locator('#tab-cuz')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#city-cuz')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#route')).toHaveAttribute('data-city', 'jfk');
    await expect(page.locator('#city-jfk')).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator('#city-jfk img')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    const slider = page.locator('#develop-range');
    await slider.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await expect(slider).toHaveValue('99');
    await expect(page.locator('#develop-value')).toHaveText('99%');
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await expect(slider).toHaveValue('99');
    await fit();
    const destinations: string[] = [];
    for (const slug of ['privacy/', 'terms/', 'support/']) {
      await page.locator(`.site-footer a[href="${home + slug}"]`).click();
      await expect(page).toHaveURL(base + home + slug);
      await expect(page.locator('html')).toHaveAttribute('lang', scenario.lang);
      await expect(page.locator('h1')).toBeVisible();
      await fit();
      destinations.push(new URL(page.url()).pathname);
    }
    const other = scenario.lang === 'ko' ? 'en' : 'ko';
    await page.locator(`.language a[data-language="${other}"]`).click();
    await expect(page).toHaveURL(base + '/nonogram/' + (other === 'ko' ? 'ko/' : '') + 'support/');
    await expect(page.locator('html')).toHaveAttribute('lang', other);
    expect(errors).toEqual([]);
    evidence.push({
      scenario,
      engine: 'Playwright WebKit on macOS; mobile viewport emulation, not a real iPhone',
      version: browser.version(),
      userAgent: await page.evaluate(() => navigator.userAgent),
      fonts,
      destinations,
      errors,
    });
    await fs.mkdir(path.resolve('reports'), { recursive: true });
    await fs.writeFile(
      path.resolve('reports/compatibility.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), base, checks: evidence }, null, 2),
    );
    await context.close();
  });
}
