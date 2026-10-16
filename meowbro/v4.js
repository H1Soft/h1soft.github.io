// Meowbro landing v4 — behavior only; every visible word lives in the HTML so the
// site's 17-language pipeline can translate it.
const $ = (s) => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const narrow = () => innerWidth <= 760;

function fx(parent, cls, x, y, life, text) {
  const el = document.createElement('div');
  el.className = cls;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  if (text !== undefined) el.textContent = text;
  parent.appendChild(el);
  setTimeout(() => el.remove(), life);
  return el;
}

// Hero — the cat auto-attacks the nearest slime, like in the game (taps fire too).
// Slimes keep to the open ground beside the cat and never walk over it.
(() => {
  const hero = $('.hero'), field = $('#field'), cat = $('#heroCat');
  const slimes = [];
  let visible = true;
  function lane() {
    const fr = field.getBoundingClientRect(), c = cat.getBoundingClientRect(), w = fr.width, sw = narrow() ? 60 : 90;
    const left = c.left - fr.left, right = c.right - fr.left;
    // Cat on the right half: slimes roam to its left; otherwise to its right.
    const span = left + c.width / 2 > w / 2 ? [w * 0.05, left - sw - 24] : [right + 8, w - sw - 6];
    return [span[0], Math.max(span[0] + sw, span[1])];
  }
  function spawn(s) {
    const [a, b] = lane();
    const far = cat.getBoundingClientRect().left > innerWidth / 2 ? a : b;  // re-enter away from the cat
    s.x = far;
    s.dir = far === a ? 1 : -1;
    s.speed = rand(40, 75);
    s.hp = 4;
    s.el.style.transform = `translate(${s.x}px, ${field.clientHeight - (narrow() ? 24 : 110) - s.el.offsetHeight}px) scaleX(${s.dir})`;
    s.el.classList.remove('dead');
  }
  const count = narrow() ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('img');
    el.className = 'slime';
    el.src = 'assets/mob-slime.webp';
    el.alt = '';
    field.appendChild(el);
    const s = { el, phase: i * 2.1, y: 0 };
    spawn(s);
    const [a, b] = lane();
    s.x = a + (b - a) * (count === 2 ? 0.1 + i * 0.8 : 0.1 + i * 0.4);
    slimes.push(s);
  }
  const alive = () => slimes.filter((s) => !s.el.classList.contains('dead'));
  function muzzle(faceLeft) {
    const fr = field.getBoundingClientRect(), c = cat.getBoundingClientRect();
    return [c.left - fr.left + c.width * (faceLeft ? 0.07 : 0.93), c.top - fr.top + c.height * 0.56];
  }
  function center(s) {
    const fr = field.getBoundingClientRect(), r = s.el.getBoundingClientRect();
    return [r.left - fr.left + r.width / 2, r.top - fr.top + r.height / 2];
  }
  function hit(t, x, y) {
    const crit = Math.random() < 0.2;
    fx(field, 'dmg' + (crit ? ' crit' : ''), x, y - 10, 820, crit ? Math.round(rand(60, 90)) + '!' : Math.round(rand(18, 34)));
    t.hp -= crit ? 3 : 1;
    t.el.classList.add('hit');
    setTimeout(() => t.el.classList.remove('hit'), 90);
    if (crit && !reduce) { hero.classList.remove('shake'); void hero.offsetWidth; hero.classList.add('shake'); }
    if (t.hp <= 0) {
      t.el.classList.add('dead');
      setTimeout(() => fx(field, 'dmg coin', x, y - 40, 820, '+5G'), 120);
      setTimeout(() => spawn(t), 1400);
    }
  }
  function fire(tx, ty, target) {
    const c = cat.getBoundingClientRect(), fr = field.getBoundingClientRect();
    const faceLeft = tx < c.left - fr.left + c.width * 0.5;
    cat.style.scale = faceLeft ? '-1 1' : '1 1';
    const [mx, my] = muzzle(faceLeft);
    cat.classList.remove('kick'); void cat.offsetWidth; cat.classList.add('kick');
    fx(field, 'flash', mx, my, 140);
    const casing = fx(field, 'casing', mx + (faceLeft ? 0.2 : -0.2) * c.width, my, 600);
    casing.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${faceLeft ? 70 : -70}px,-60px) rotate(200deg)`, offset: 0.4 }, { transform: `translate(${faceLeft ? 110 : -110}px,40px) rotate(420deg)`, opacity: 0 }], { duration: 600, easing: 'ease-out' });
    const b = fx(field, 'bullet', 0, 0, 2000);
    b.animate([{ transform: `translate(${mx}px,${my}px)` }, { transform: `translate(${tx}px,${ty}px)` }], { duration: Math.max(60, Math.hypot(tx - mx, ty - my) / 2.6), easing: 'linear' }).onfinish = () => {
      b.remove();
      fx(field, 'spark', tx, ty, 260);
      const t = target && !target.el.classList.contains('dead') ? target : alive().find((s) => {
        const [sx, sy] = center(s);
        return Math.abs(sx - tx) < s.el.offsetWidth / 2 + 22 && Math.abs(sy - ty) < s.el.offsetHeight / 2 + 22;
      });
      if (t) hit(t, tx, ty);
    };
  }
  let last = performance.now(), cooldown = 0.8;
  (function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const h = field.clientHeight, [a, b] = lane(), floor = narrow() ? 24 : 110;
    const live = alive().sort((p, q) => p.x - q.x);
    for (const s of live) {
      s.x += s.dir * s.speed * dt;
      if (s.x < a || s.x > b) { s.dir = s.x < a ? 1 : -1; s.x = Math.max(a, Math.min(b, s.x)); }
    }
    for (let i = 1; i < live.length; i++) {  // don't stack on each other either
      const p = live[i - 1], q = live[i];
      if (q.x - p.x < (narrow() ? 46 : 70)) { p.dir = -1; q.dir = 1; }
    }
    for (const s of live) {
      const hop = reduce ? 0 : Math.abs(Math.sin(now / 260 + s.phase)) * 14;
      s.el.style.transform = `translate(${s.x}px, ${h - floor - s.el.offsetHeight - hop - (s.phase % 3) * 8}px) scaleX(${s.dir})`;
      s.el.classList.add('ready');
    }
    cooldown -= dt;
    if (visible && !reduce && cooldown <= 0 && live.length) {
      cooldown = 0.6;
      const [mx, my] = muzzle(false);
      const target = live.reduce((best, s) => {
        const [sx, sy] = center(s), d = Math.hypot(sx - mx, sy - my);
        return !best || d < best.d ? { s, d, sx, sy } : best;
      }, null);
      fire(target.sx, target.sy, target.s);
    }
    requestAnimationFrame(loop);
  })(last);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button')) return;
    const fr = field.getBoundingClientRect();
    fire(e.clientX - fr.left, e.clientY - fr.top, null);
  });
})();

// The top bar's and sticky bar's store buttons appear once the hero button scrolls away.
const heroStore = $('.hero .store');
if (heroStore) new IntersectionObserver((es) => {
  $('.topbar').classList.toggle('solid', !es[0].isIntersecting);
  const sticky = $('.sticky');
  if (sticky) sticky.classList.toggle('show', !es[0].isIntersecting);
}).observe(heroStore);

// Language screen: tap the dimmed backdrop or press Escape to close.
document.querySelectorAll('.site-languages').forEach((d) => {
  const menu = d.querySelector('.nav-dropdown');
  if (menu) menu.addEventListener('click', (e) => { if (e.target === menu) d.open = false; });
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.site-languages[open]').forEach((d) => { d.open = false; d.querySelector('summary').focus(); });
});

// Real footage plays only while visible.
const video = $('#boss video');
if (video) {
  video.muted = true;
  new IntersectionObserver((es) => {
    if (es[0].isIntersecting && !reduce) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause();
  }, { threshold: 0.3 }).observe(video);
}
