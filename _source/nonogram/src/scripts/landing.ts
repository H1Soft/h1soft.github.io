const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const emit = (name: string, params: Record<string, unknown> = {}) =>
  document.dispatchEvent(new CustomEvent('nonogram:event', { detail: { name, ...params } }));
// First-party DOM hooks only. No events leave the browser without a configured analytics adapter.
const route = document.querySelector<HTMLElement>('.route-section');
if (route) {
  const tabs = [...route.querySelectorAll<HTMLButtonElement>('[role=tab]')];
  const panels = [...route.querySelectorAll<HTMLElement>('[role=tabpanel]')];
  let current = 0,
    interacted = false,
    visible = false,
    timer: ReturnType<typeof setTimeout> | undefined;
  const load = (i: number) => {
    const img = panels[i]?.querySelector<HTMLImageElement>('img[data-src]');
    if (img && !img.getAttribute('src')) img.src = img.dataset.src!;
  };
  const stop = () => {
    interacted = true;
    clearTimeout(timer);
  };
  const cycle = () => {
    clearTimeout(timer);
    if (visible && !interacted && !reduced.matches)
      timer = setTimeout(() => select((current + 1) % tabs.length, false), 4500);
  };
  const select = (index: number, user = true) => {
    if (user) stop();
    current = index;
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === index));
      t.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    route.dataset.city = tabs[index].dataset.code;
    load(index);
    load((index + 1) % tabs.length);
    if (user) emit('city_select', { city: tabs[index].dataset.code });
    cycle();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('focus', () => select(i));
    tab.addEventListener('keydown', (e) => {
      let n = i;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      else return;
      e.preventDefault();
      tabs[n].focus();
    });
  });
  route.addEventListener('pointerdown', stop, { passive: true });
  route.addEventListener('keydown', stop);
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) load((current + 1) % tabs.length);
      cycle();
    },
    { threshold: 0.15 },
  );
  observer.observe(route);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else cycle();
  });
  reduced.addEventListener('change', cycle);
}
const board = document.querySelector('.departure-board');
if (board) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        board.classList.add('revealed');
        observer.disconnect();
      }
    },
    { threshold: 0.35 },
  );
  observer.observe(board);
}
const develop = document.querySelector<HTMLElement>('[data-develop]');
const range = document.querySelector<HTMLInputElement>('#develop-range');
const output = document.querySelector<HTMLOutputElement>('#develop-value');
if (develop && range && output) {
  let manual = false,
    frame = 0,
    visible = false;
  const update = (value: number) => {
    const n = Math.round(Math.max(0, Math.min(100, value)));
    develop.style.setProperty('--develop', `${n}%`);
    range.value = String(n);
    output.value = `${n}%`;
  };
  const tick = () => {
    if (!visible || manual || reduced.matches) return;
    const r = develop.getBoundingClientRect();
    update(((innerHeight - r.top) / (innerHeight + r.height)) * 100);
    frame = requestAnimationFrame(tick);
  };
  range.addEventListener('input', () => {
    manual = true;
    cancelAnimationFrame(frame);
    update(Number(range.value));
  });
  range.addEventListener('change', () => emit('develop_change', { amount: Number(range.value) }));
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(tick);
    },
    { rootMargin: '100px' },
  );
  observer.observe(develop);
  reduced.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    if (reduced.matches && !manual) update(50);
    else if (visible) frame = requestAnimationFrame(tick);
  });
}
const routePath = document.querySelector<SVGPathElement>('.route-path');
if (routePath) {
  let frame = 0,
    visible = false;
  const tick = () => {
    if (!visible || reduced.matches) return;
    const r = routePath.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight * 0.7)));
    routePath.style.strokeDashoffset = String(1 - progress);
    frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    cancelAnimationFrame(frame);
    if (visible) frame = requestAnimationFrame(tick);
  });
  observer.observe(routePath);
  reduced.addEventListener('change', () => {
    cancelAnimationFrame(frame);
    if (visible && !reduced.matches) frame = requestAnimationFrame(tick);
  });
}
const hints = document.querySelector('[data-hints]');
if (hints) {
  const tabs = [...hints.querySelectorAll<HTMLButtonElement>('[role=tab]')];
  const panels = [...hints.querySelectorAll<HTMLElement>('[role=tabpanel]')];
  const select = (n: number) => {
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === n));
      t.tabIndex = i === n ? 0 : -1;
      panels[i].hidden = i !== n;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      let n = i;
      if (e.key === 'ArrowRight') n = (i + 1) % 3;
      else if (e.key === 'ArrowLeft') n = (i + 2) % 3;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = 2;
      else return;
      e.preventDefault();
      select(n);
      tabs[n].focus();
    });
  });
}
document.querySelectorAll<HTMLButtonElement>('.flip-photo').forEach((photo) => {
  const set = (on: boolean) => {
    photo.setAttribute('aria-pressed', String(on));
    photo.querySelector('.photo-front')?.setAttribute('aria-hidden', String(on));
    photo.querySelector('.photo-back')?.setAttribute('aria-hidden', String(!on));
  };
  photo.addEventListener('click', () => set(photo.getAttribute('aria-pressed') !== 'true'));
  photo.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') set(true);
  });
  photo.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') set(false);
  });
});
const sticky = document.querySelector<HTMLElement>('.mobile-sticky');
const sentinel = document.querySelector('.sticky-sentinel');
if (sticky && sentinel) {
  new IntersectionObserver(
    (entries) => {
      sticky.hidden = entries[0].boundingClientRect.top > 0;
    },
    { threshold: 0 },
  ).observe(sentinel);
}
document
  .querySelectorAll<HTMLAnchorElement>('a[data-store]')
  .forEach((link) =>
    link.addEventListener('click', () =>
      emit('store_click', {
        store: link.dataset.store,
        position: link.closest<HTMLElement>('[data-position]')?.dataset.position,
      }),
    ),
  );
document.querySelectorAll('.faq-list details').forEach((details, i) =>
  details.addEventListener('toggle', () => {
    if ((details as HTMLDetailsElement).open) emit('faq_open', { question: i + 1 });
  }),
);

document
  .querySelectorAll('video')
  .forEach((video) => video.addEventListener('play', () => emit('video_play'), { once: true }));

// Keep keyboard focus visible above the mobile action bar.
document.addEventListener('focusin', (event) => {
  const target = event.target;
  if (
    !(target instanceof HTMLElement) ||
    !sticky ||
    sticky.hidden ||
    innerWidth >= 640 ||
    sticky.contains(target)
  )
    return;
  const edge = sticky.getBoundingClientRect().top;
  const bounds = target.getBoundingClientRect();
  if (bounds.bottom > edge && bounds.top < innerHeight)
    window.scrollBy({ top: bounds.bottom - edge + 16, behavior: 'instant' });
});
