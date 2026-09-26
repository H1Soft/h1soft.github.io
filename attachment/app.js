(() => {
  'use strict';
  const dataNode = document.getElementById('promo-data');
  const data = dataNode ? JSON.parse(dataNode.textContent) : null;
  if (!data) return;
  // Keep previously shared links functional after the promotional site moves to /attachment/.
  if (/^#\/(?:t|with|pair)\//.test(location.hash)) {
    location.replace(data.playPath + location.search + location.hash);
    return;
  }
  const event = (name, detail = {}) => {
    // No analytics service is configured. Hosts may subscribe explicitly; nothing is transmitted.
    document.dispatchEvent(new CustomEvent(name, { detail }));
  };
  const image = document.getElementById('hero-plush-image');
  const shuffle = document.getElementById('shuffle-plush');
  const hint = document.getElementById('shuffle-hint');
  let current = data.types.findIndex(type => type.id === 'P07');
  let changing = false;
  const showPlush = (index, announce) => {
    if (changing || index === current) return;
    changing = true;
    shuffle.setAttribute('aria-busy', 'true');
    const type = data.types[index];
    const nextImage = new Image();
    nextImage.onload = () => {
      const previous = data.types[current];
      image.src = nextImage.src;
      image.alt = `${type.name} 인형 — ${type.nick}`;
      shuffle.setAttribute('aria-label', `다른 인형 구경하기. 현재 ${type.name}`);
      shuffle.classList.remove('changing');
      void shuffle.offsetWidth;
      shuffle.classList.add('changing');
      if (announce) hint.textContent = `${type.name}! 톡 누르면 다른 친구가 나와요`;
      current = index;
      changing = false;
      shuffle.removeAttribute('aria-busy');
      if (announce) event('promo_plush_shuffle', { from: previous.id, to: type.id });
    };
    nextImage.onerror = () => {
      changing = false;
      shuffle.removeAttribute('aria-busy');
      if (announce) hint.textContent = '인형을 불러오지 못했어요. 한 번 더 톡 눌러 주세요';
    };
    nextImage.src = data.basePath + 'assets/' + type.image;
  };
  if (shuffle) {
    shuffle.addEventListener('click', () => showPlush((current + 1 + Math.floor(Math.random() * (data.types.length - 1))) % data.types.length, true));
    // The server-rendered doll remains visible without JS. Randomize only after the initial render.
    window.addEventListener('load', () => showPlush(Math.floor(Math.random() * data.types.length), false), { once: true });
  }
  const filters = [...document.querySelectorAll('[data-filter]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filters.forEach(item => {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('active', active);
    });
    let count = 0;
    document.querySelectorAll('.lineup [data-quad]').forEach(tile => {
      tile.hidden = selected !== 'all' && tile.dataset.quad !== selected;
      if (!tile.hidden) count++;
    });
    document.getElementById('filter-status').textContent = `${button.textContent.trim()} 인형 ${count}종을 보고 있어요`;
  }));
  document.querySelectorAll('[data-cta]').forEach(link => link.addEventListener('click', () => event('promo_cta_click', { target: 'web_test', position: link.dataset.cta })));
  document.querySelectorAll('[data-slug]').forEach(link => link.addEventListener('click', () => event('promo_type_open', { slug: link.dataset.slug })));
  document.querySelectorAll('details[data-faq]').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) event('promo_faq_open', { q_id: item.dataset.faq });
  }));
  const depths = new Set();
  let scrollQueued = false;
  const recordScroll = () => {
    const height = document.documentElement.scrollHeight - innerHeight;
    const depth = height > 0 ? Math.round(scrollY / height * 100) : 100;
    [25, 50, 75, 100].forEach(mark => {
      if (depth >= mark && !depths.has(mark)) { depths.add(mark); event('promo_scroll', { depth: mark }); }
    });
    scrollQueued = false;
  };
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(recordScroll); } }, { passive: true });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= .5) { event('promo_qr_view', { position: 'hero' }); observer.unobserve(entry.target); }
    }), { threshold: .5 });
    document.querySelectorAll('.qr-block').forEach(node => observer.observe(node));
  }
  event('promo_view', { launch_state: data.launchState, analytics_enabled: false });
})();
