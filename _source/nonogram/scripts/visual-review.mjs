import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
for (const [name, width, lang, theme] of [
  ['desktop-dark', 1440, 'en', 'dark'],
  ['mobile-dark', 390, 'en', 'dark'],
  ['mobile-ko', 390, 'ko', 'light'],
  ['desktop-light', 1440, 'en', 'light'],
  ['narrow-ko', 320, 'ko', 'dark'],
]) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const response = await page.goto(`http://127.0.0.1:8766/nonogram/${lang === 'ko' ? 'ko/' : ''}`);
  await page.evaluate(() => document.fonts.ready);
  for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 700) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(150);
  await page.screenshot({ path: `reports/${name}.png`, fullPage: true });
  const overflow = await page.evaluate(() => ({
    width: innerWidth,
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    fonts: [...document.fonts].map((f) => ({ family: f.family, status: f.status })),
  }));
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  results.push({
    name,
    status: response.status(),
    errors,
    overflow,
    violations: axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  });
  await context.close();
}
await fs.writeFile('reports/visual-a11y.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
await browser.close();
