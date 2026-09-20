import { chromium } from '@playwright/test';
const origin = process.env.SITE_PREVIEW_URL || 'http://127.0.0.1:8767';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
for (const lang of ['en', 'ko']) {
  await page.goto(`${origin}/nonogram/`);
  await page.setContent(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
    @font-face{font-family:Newsreader;src:url('${origin}/nonogram/fonts/newsreader.woff2')}
    @font-face{font-family:Pretendard;src:url('${origin}/nonogram/fonts/pretendard.woff2')}
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#111c24;color:#ede6d8;font-family:Pretendard,Arial}
    .backdrop{position:absolute;inset:-85px 0 auto;width:1200px;height:800px;object-fit:cover;opacity:.15;mask-image:linear-gradient(90deg,transparent,#000 55%)}
    main{position:relative;padding:60px 66px;height:100%}.brand{display:flex;gap:15px;align-items:center;font-family:Newsreader,Georgia;font-size:30px}.brand img{width:44px;height:44px;border-radius:10px}
    h1{font-family:Newsreader,Pretendard,Georgia;font-size:${lang === 'ko' ? 56 : 66}px;font-weight:500;letter-spacing:-1.5px;line-height:1.16;margin:40px 0 28px;max-width:590px;word-break:keep-all}
    .meta{color:#b5c0c7;font-size:15px;letter-spacing:.6px}.photo{position:absolute;right:70px;top:150px;width:328px;background:#fffcf5;color:#17405c;padding:12px 12px 23px;transform:rotate(5deg);box-shadow:0 18px 38px #0005}
    .photo img{width:304px;height:228px;object-fit:cover}.caption{display:flex;justify-content:space-between;align-items:baseline;margin:18px 7px 0;font-family:Newsreader,Pretendard,Georgia;font-size:23px}.caption small{font:12px Arial;letter-spacing:1px}
    .foot{position:absolute;bottom:40px;left:66px;color:#7fc7e4;font-size:12px;letter-spacing:1px}
    </style></head><body><img class="backdrop" src="${origin}/nonogram/images/hero-icon-art.webp?v=20260920-full-bleed" alt=""><main>
    <div class="brand"><img src="${origin}/nonogram/images/app-icon-small.webp?v=20260920-full-bleed" alt="">Nonogram Trip</div>
    <h1>${lang === 'ko' ? '퍼즐 하나가<br>다녀왔던 곳이 됩니다.' : 'Every puzzle is a<br>place you’ve been.'}</h1>
    <p class="meta">${lang === 'ko' ? '열두 도시 · 192편의 퍼즐 · 나만의 여행 앨범' : 'Twelve cities · 192 puzzles · Your own travel album'}</p>
    <figure class="photo"><img src="${origin}/nonogram/images/city-hkg.avif" alt=""><figcaption class="caption"><span>${lang === 'ko' ? '홍콩의 기억' : 'A memory of Hong Kong'}</span><small>HKG</small></figcaption></figure>
    <span class="foot">H1SOFT.GITHUB.IO/NONOGRAM</span></main></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({ path: `public/images/og-${lang}.png` });
}
await browser.close();
