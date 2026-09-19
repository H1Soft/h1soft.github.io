import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const lang of ['en', 'ko']) {
  await p.goto('http://127.0.0.1:8766/nonogram/');
  await p.setContent(
    `<html lang="${lang}"><head><style>@font-face{font-family:Newsreader;src:url('http://127.0.0.1:8766/nonogram/fonts/newsreader.woff2')}@font-face{font-family:Pretendard;src:url('http://127.0.0.1:8766/nonogram/fonts/pretendard.woff2')}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#111c24;color:#ede6d8;font-family:Pretendard,Arial}img.bg{position:absolute;inset:0;width:1200px;height:630px;object-fit:cover;opacity:.2}main{position:relative;display:flex;justify-content:space-between;align-items:center;padding:70px;height:100%}article{width:615px}.brand{display:flex;gap:15px;align-items:center;font-family:Newsreader,Georgia;font-size:30px}.brand img{width:45px;height:45px;border-radius:12px}h1{font-family:Newsreader,Pretendard,Georgia;font-size:${lang === 'ko' ? 55 : 65}px;font-weight:500;letter-spacing:-1px;line-height:1.1;margin:37px 0 26px;max-width:540px;word-break:keep-all}.meta{color:#7fc7e4;letter-spacing:2px;font:13px Arial}.grid{width:342px;height:342px;padding:13px;border:2px solid #7e99a6;border-radius:37px;background:#223742;box-shadow:0 24px 60px #0006;display:grid;grid-template-columns:repeat(5,1fr);gap:3px}.cell{background:#2c444f}.on{background:#f1ede3}.grid .cell:nth-child(5){border-radius:0 16px 0 0}.grid .cell:nth-child(25){border-radius:0 0 16px 0}.foot{position:absolute;bottom:33px;left:70px;font:12px Arial;color:#b5c0c7;letter-spacing:1px}</style></head><body><img class="bg" src="http://127.0.0.1:8766/nonogram/images/city-kef.avif"><main><article><div class="brand"><img src="http://127.0.0.1:8766/nonogram/images/app-icon.webp">Nonogram Trip</div><h1>${lang === 'ko' ? '퍼즐 하나가 다녀왔던 곳이 됩니다.' : 'Every puzzle is a place you’ve been.'}</h1><p class="meta">${lang === 'ko' ? '12개 도시 · 192편의 퍼즐 · 모든 기능 무료' : '12 CITIES · 192 FLIGHTS · ALL FEATURES FREE'}</p></article><div class="grid">${'0000100011111110001100001'
      .split('')
      .map((v) => `<span class="cell ${v === '1' ? 'on' : ''}"></span>`)
      .join(
        '',
      )}</div><span class="foot">H1SOFT.GITHUB.IO/NONOGRAM · ${lang === 'ko' ? '웹에서 바로 퍼즐을 풀어보세요' : 'TRY YOUR FIRST PUZZLE ONLINE'}</span></main></body></html>`,
  );
  await p.evaluate(() => document.fonts.ready);
  await p.locator('img').evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await p.screenshot({ path: `public/images/og-${lang}.png` });
}
await b.close();
