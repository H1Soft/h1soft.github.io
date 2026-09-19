import { test, expect, type Page, type CDPSession } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEMO_5 } from '../src/scripts/demo-engine';
import { DEMO_10 } from '../src/scripts/demo-next';

// Run against the built full host: SITE_PREVIEW_URL=http://127.0.0.1:8767
// node node_modules/@playwright/test/cli.js test tests/demo.spec.ts --workers=1
const base = process.env.SITE_PREVIEW_URL || 'http://127.0.0.1:8767';
const reportDir = path.resolve('reports');
const root = '[data-nonogram-demo]';
const nextModule = /\/demo-next\.[^/]+\.js(?:\?.*)?$/;
const ink = (puzzle: typeof DEMO_5) =>
  puzzle.solution.flat().flatMap((value, index) => (value ? [index] : []));
const cell = (page: Page, index: number) => page.locator(`[data-cell="${index}"]`);

test.use({
  launchOptions: { channel: 'chrome' },
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  colorScheme: 'light',
});
test.setTimeout(60_000);
test.beforeAll(async () => {
  await fs.mkdir(reportDir, { recursive: true });
});
test.afterEach(async ({}, info) => {
  // Read back the report because Playwright replaces its worker after a failure.
  const file = path.join(reportDir, 'demo-functional.json');
  const previous = await fs
    .readFile(file, 'utf8')
    .then(JSON.parse)
    .catch(() => ({ tests: [] }));
  const results = new Map<string, Record<string, unknown>>(
    previous.tests.map((result: Record<string, unknown>) => [String(result.name), result]),
  );
  results.set(info.title, {
    name: info.title,
    status: info.status,
    durationMs: info.duration,
    errors: info.errors.map((error) => error.message),
  });
  await fs.writeFile(
    file,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), base, tests: [...results.values()] },
      null,
      2,
    ),
  );
});

async function open(page: Page, lang = 'en') {
  const errors: string[] = [],
    lazyRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (nextModule.test(new URL(request.url()).pathname)) lazyRequests.push(request.url());
  });
  await page.addInitScript(() => {
    (window as any).__demoEvents = [];
    document.addEventListener('nonogram:event', (event) =>
      (window as any).__demoEvents.push((event as CustomEvent).detail),
    );
  });
  const response = await page.goto(`${base}/nonogram/${lang === 'ko' ? 'ko/' : ''}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator(root)).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => document.fonts.ready);
  return { errors, lazyRequests };
}

async function events(page: Page) {
  return page.evaluate(
    () =>
      (window as any).__demoEvents as {
        name: string;
        puzzle: string;
        size: string;
        lang: string;
      }[],
  );
}
async function solve(page: Page, puzzle = DEMO_5, pointer = false) {
  for (const index of ink(puzzle)) {
    if (pointer) await cell(page, index).tap();
    else {
      await cell(page, index).focus();
      await page.keyboard.press('Space');
    }
  }
}
async function complete(page: Page) {
  await expect(page.locator(root)).toHaveAttribute('data-phase', 'complete');
}
async function centre(page: Page, index: number) {
  await cell(page, index).scrollIntoViewIfNeeded();
  const box = (await cell(page, index).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function touch(
  cdp: CDPSession,
  type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
  point?: { x: number; y: number },
) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [point] : [] });
}

test('5×5 fits narrow screens with 44px targets; initial state does not fetch 10×10', async ({
  page,
}) => {
  const { errors, lazyRequests } = await open(page);
  await expect(page.locator('[data-demo-result-title]')).toHaveText('');
  for (const width of [320, 390, 430, 800]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: innerWidth,
      cell: document.querySelector('[data-cell]')!.getBoundingClientRect().width,
      assembly: document.querySelector('[data-demo-assembly]')!.getBoundingClientRect().width,
      localViewport: document.querySelector('[data-demo-viewport]')!.clientWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.cell).toBeGreaterThanOrEqual(44);
    expect(dimensions.assembly).toBeLessThanOrEqual(dimensions.localViewport + 1);
  }
  expect(lazyRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('keyboard, assistive click, error feedback and unlimited grouped undo use one tab stop', async ({
  page,
}) => {
  const { errors } = await open(page);
  await cell(page, 0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 1)).toBeFocused();
  await page.keyboard.press('x');
  await expect(cell(page, 1)).toHaveAttribute('data-state', 'marked');
  await page.keyboard.press('Space');
  await expect(cell(page, 1)).toHaveAttribute('data-state', 'filled');
  await expect(cell(page, 1)).toHaveClass(/is-error/);
  await expect(cell(page, 1)).toHaveAttribute('aria-label', /does not match/);
  await page.keyboard.press('Backspace');
  await expect(cell(page, 1)).toHaveAttribute('data-state', 'empty');
  for (const state of ['filled', 'marked', 'empty']) {
    await page.keyboard.press('u');
    await expect(cell(page, 1)).toHaveAttribute('data-state', state);
  }
  await page.keyboard.press('End');
  await expect(cell(page, 4)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(cell(page, 9)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(cell(page, 5)).toBeFocused();
  await expect(page.locator('[data-cell][tabindex="0"]')).toHaveCount(1);
  await cell(page, 4).dispatchEvent('click', { detail: 0 });
  await expect(cell(page, 4)).toHaveAttribute('data-state', 'filled');
  await page.locator('[data-demo-undo]').click();
  await expect(cell(page, 4)).toHaveAttribute('data-state', 'empty');
  expect(errors).toEqual([]);
});

test('native touch cancellation, 250ms inverse hold and both drag axes preserve grouped undo', async ({
  page,
  context,
}) => {
  const { errors } = await open(page);
  const cdp = await context.newCDPSession(page);
  await touch(cdp, 'touchStart', await centre(page, 0));
  await touch(cdp, 'touchCancel');
  await expect(cell(page, 0)).toHaveAttribute('data-state', 'empty');
  expect(await events(page)).toEqual([]);
  await touch(cdp, 'touchStart', await centre(page, 0));
  await page.waitForTimeout(310);
  await touch(cdp, 'touchEnd');
  await expect(cell(page, 0)).toHaveAttribute('data-state', 'marked');
  await expect(page.locator('[data-demo-tool="fill"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await events(page)).toEqual([]); // An inverse hold must not count its provisional ink as starting.
  await page.locator('[data-demo-undo]').click();
  for (const [first, last, expected] of [
    [10, 14, [10, 11, 12, 13, 14]],
    [4, 24, [4, 9, 14, 19, 24]],
  ] as const) {
    const start = await centre(page, first),
      end = await centre(page, last);
    await touch(cdp, 'touchStart', start);
    for (let step = 1; step <= 8; step++)
      await touch(cdp, 'touchMove', {
        x: start.x + ((end.x - start.x) * step) / 8 + (first === 4 ? step : 0),
        y: start.y + ((end.y - start.y) * step) / 8 + (first === 10 ? step : 0),
      });
    await touch(cdp, 'touchEnd');
    for (let index = 0; index < 25; index++)
      await expect(cell(page, index)).toHaveAttribute(
        'data-state',
        (expected as readonly number[]).includes(index) ? 'filled' : 'empty',
      );
    await expect(cell(page, last)).toBeFocused();
    await page.locator('[data-demo-undo]').click();
    await expect(page.locator('[data-cell][data-state="empty"]')).toHaveCount(25);
  }
  expect((await events(page)).filter((event) => event.name === 'demo_start')).toHaveLength(1);
  expect(errors).toEqual([]);
});

for (const lang of ['en', 'ko']) {
  test(`${lang}: every ink cell receives touch, final tap keeps reveal, replay and accessible completion work`, async ({
    page,
    context,
  }) => {
    const { errors, lazyRequests } = await open(page, lang);
    const audit = async () => {
      const result = await new AxeBuilder({ page })
        .include(root)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((violation) => ({
          id: violation.id,
          targets: violation.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
    };
    await audit();
    for (let round = 0; round < 2; round++) {
      await solve(page, DEMO_5, true);
      expect(await page.locator(root).getAttribute('data-phase')).not.toBe('complete');
      if (!round) await page.locator('[data-demo-skip]').click();
      await complete(page);
      await expect(page.locator('[data-demo-result-title]')).toHaveText(
        lang === 'en' ? 'Paper plane' : '종이비행기',
      );
      await expect(page.locator('[data-demo-grid]')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('[data-demo-result-title]')).toBeFocused();
      const gap = await page.evaluate(
        () =>
          document.querySelector('[data-demo-caption]')!.getBoundingClientRect().top -
          document.querySelector('[data-demo-window]')!.getBoundingClientRect().bottom,
      );
      expect(gap).toBeLessThan(90);
      if (!round) await page.locator('[data-demo-replay]').click();
    }
    await audit();
    expect(lazyRequests).toEqual([]);
    expect((await events(page)).map((event) => event.name)).toEqual([
      'demo_start',
      'demo_complete',
      'demo_reset',
      'demo_start',
      'demo_complete',
    ]);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
    expect(await context.cookies()).toEqual([]);
    expect(errors).toEqual([]);
    await page
      .locator(root)
      .screenshot({ path: path.join(reportDir, `demo-complete-${lang}.png`) });
  });
}

for (const key of ['Backspace', 'Space', 'x', 'u', 'ArrowLeft']) {
  test(`held final ink commits before concurrent ${key}; completed board stays solved`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { errors } = await open(page);
    for (const index of ink(DEMO_5).filter((index) => index !== 24)) {
      await cell(page, index).focus();
      await page.keyboard.press('Space');
    }
    const point = await centre(page, 24);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.keyboard.press(key);
    await page.mouse.up();
    await complete(page);
    await expect(cell(page, 24)).toHaveAttribute('data-state', 'filled');
    await expect(page.locator('[data-cell][data-state="filled"]')).toHaveCount(11);
    await expect(page.locator('[data-demo-result-title]')).toBeFocused();
    expect((await events(page)).filter((event) => event.name === 'demo_complete')).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}

test('replay cancels a pending lazy advance; 10×10 later loads once and completes by keyboard in dark mode', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  const { errors, lazyRequests } = await open(page);
  expect(lazyRequests).toEqual([]);
  await solve(page);
  await complete(page);
  expect(lazyRequests).toEqual([]);
  let release!: () => void, requested!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const reached = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route(nextModule, async (route) => {
    requested();
    await gate;
    await route.continue();
  });
  const response = page.waitForResponse((response) =>
    nextModule.test(new URL(response.url()).pathname),
  );
  await page.locator('[data-demo-next]').click();
  await reached;
  await page.locator('[data-demo-replay]').click();
  await expect(page.locator(root)).toHaveAttribute('data-size', '5');
  await expect(page.locator('[data-cell][data-state="empty"]')).toHaveCount(25);
  release();
  await response;
  await page.waitForTimeout(100);
  await expect(page.locator(root)).toHaveAttribute('data-phase', 'playing');
  await expect(page.locator(root)).toHaveAttribute('data-size', '5');
  expect((await events(page)).some((event) => event.name === 'demo_advance_10')).toBe(false);
  await solve(page);
  await complete(page);
  await page.locator('[data-demo-next]').click();
  await expect(page.locator('[data-cell]')).toHaveCount(100);
  expect(lazyRequests).toHaveLength(1);
  await expect(page.locator('[data-clue-column="0"]')).toHaveText('0');
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.locator('[data-demo-pan]')).toBeVisible();
  await page.locator('[data-demo-pan-right]').click();
  await expect
    .poll(() => page.locator('[data-demo-viewport]').evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await solve(page, DEMO_10);
  await complete(page);
  await expect(page.locator('[data-demo-result-title]')).toHaveText('Hot air balloon');
  await expect(page.locator('[data-cell][data-state="filled"]')).toHaveCount(48);
  expect((await events(page)).filter((event) => event.name === 'demo_advance_10')).toHaveLength(1);
  const audit = await new AxeBuilder({ page })
    .include(root)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(errors).toEqual([]);
  await page.locator(root).screenshot({ path: path.join(reportDir, 'demo-complete-10-dark.png') });
});

test('10×10 completes by touch with no intercepted cells or false store destination', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { errors } = await open(page, 'ko');
  await solve(page);
  await complete(page);
  await page.locator('[data-demo-next]').click();
  await expect(page.locator('[data-cell]')).toHaveCount(100);
  await solve(page, DEMO_10, true);
  await complete(page);
  await expect(page.locator('[data-demo-result-title]')).toHaveText('열기구');
  await expect(page.locator('[data-cell][data-state="filled"]')).toHaveCount(48);
  await expect(page.locator('[data-demo-next]')).toBeHidden();
  await expect(page.locator('[data-demo-result] a')).toHaveAttribute('href', '#download');
  expect(errors).toEqual([]);
});

test('desktop dark mode keeps both playable boards accessible and keyboard reachable', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const { errors } = await open(page);
  for (const size of [5, 10]) {
    await expect(page.locator(root)).toHaveAttribute('data-size', String(size));
    await expect(page.locator('[data-cell][tabindex="0"]')).toHaveCount(1);
    const audit = await new AxeBuilder({ page })
      .include(root)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page
      .locator(root)
      .screenshot({ path: path.join(reportDir, `demo-desktop-dark-${size}.png`) });
    await solve(page, size === 5 ? DEMO_5 : DEMO_10);
    await complete(page);
    if (size === 5) await page.locator('[data-demo-next]').click();
  }
  expect(errors).toEqual([]);
  await context.close();
});

test('without JavaScript the 5×5 board and clues stay readable with a download fallback', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(`${base}/nonogram/`);
  await expect(page.locator('[data-cell][aria-disabled="true"]')).toHaveCount(25);
  await expect(page.locator('[data-clue-row="2"]')).toHaveText('5');
  await expect(page.locator(`${root} noscript`)).toBeVisible();
  await context.close();
});
