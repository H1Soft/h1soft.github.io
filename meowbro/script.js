// Add verified product URLs after store registration. Empty values remain unavailable.
const STORE_URLS = { appStore: '', googlePlay: '' };

const sceneData = {
  combat: { word: 'DODGE!', title: '공격은 자동. 생존은 실력.', text: '적의 공격을 읽고, 닿기 직전에 대시.\n아슬아슬한 회피 한 번으로\n전투의 흐름을 바꿔보세요.', image: 'assets/v2/gameplay-combat.webp', alt: '냥브로가 몬스터의 공격을 피해 싸우는 실제 전투 화면' },
  map: { word: 'CHOOSE!', title: '다음 방의 운명은, 내 손에.', text: '전투, 상점, 뜻밖의 이벤트.\n안전하게 정비할지, 보상을 노릴지.\n갈림길마다 새로운 선택이 기다립니다.', image: 'assets/v2/gameplay-map.webp', alt: '전투와 이벤트, 상점을 선택하는 냥브로의 실제 원정 지도' },
  upgrade: { word: 'GROW!', title: '같은 무기. 전혀 다른 가능성.', text: '무기를 키우고, 성장 방향을 고르고.\n유물을 더해 나에게 맞는 전투를 만드세요.\n이번 원정의 전설은 직접 완성합니다.', image: 'assets/v2/gameplay-upgrade.webp', alt: '총의 성장 방향과 전설 진화를 선택하는 실제 게임 화면' },
};
const worldData = {
  forest: { act: 'ACT I', name: '초록에 잠긴 폐허', text: '모험은, 작은 발자국 하나에서.', image: 'assets/world-forest-v2.webp', alt: '오래된 석조 폐허와 초록 나무 사이로 이어지는 숲의 길', index: '01 / 03' },
  desert: { act: 'ACT II', name: '모래 너머의 비밀', text: '뜨거운 모래 위로, 한 걸음 더.', image: 'assets/world-desert-v2.webp', alt: '뜨거운 모래와 부서진 유적 사이로 이어지는 사막의 길', index: '02 / 03' },
  snow: { act: 'ACT III', name: '얼어붙은 마지막 길', text: '차가운 바람 앞에서도, 끝까지.', image: 'assets/world-snow-v2.webp', alt: '눈과 얼음이 덮인 바위와 폐허 사이의 설원 길', index: '03 / 03' },
};
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const video = document.getElementById('gameplay-video');
const still = document.getElementById('gameplay-image');
const videoToggle = document.getElementById('video-toggle');
const evidence = document.querySelector('.evidence');
let activeScene = 'combat';
let manuallyPaused = false;
let videoFailed = false;
let evidenceVisible = false;

function updateVideoControl() {
  const paused = video.paused;
  videoToggle.setAttribute('aria-label', paused ? '플레이 영상 재생' : '플레이 영상 일시정지');
  videoToggle.querySelector('use').setAttribute('href', paused ? '#play' : '#pause');
}
function playIfAllowed() {
  if (activeScene === 'combat' && !videoFailed && !manuallyPaused && !motionPreference.matches && evidenceVisible) {
    video.play().catch(() => updateVideoControl());
  }
}
video.addEventListener('play', updateVideoControl);
video.addEventListener('pause', updateVideoControl);
videoToggle.addEventListener('click', () => {
  if (video.paused) { manuallyPaused = false; video.play().catch(() => updateVideoControl()); }
  else { manuallyPaused = true; video.pause(); }
});
function showVideoFallback() {
  videoFailed = true;
  video.hidden = true;
  videoToggle.hidden = true;
  still.hidden = false;
}
video.addEventListener('error', showVideoFallback);
video.querySelector('source').addEventListener('error', showVideoFallback);
new IntersectionObserver(entries => {
  evidenceVisible = entries[0].isIntersecting;
  if (evidenceVisible) playIfAllowed(); else video.pause();
}, { threshold: .18 }).observe(evidence);
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches) video.pause(); else playIfAllowed();
});

function wireTabs(selector, select, vertical = false) {
  const tabs = [...document.querySelectorAll(selector)];
  function activate(tab, focus = false) {
    tabs.forEach(item => { const on = item === tab; item.setAttribute('aria-selected', String(on)); item.tabIndex = on ? 0 : -1; });
    select(tab);
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      const previous = vertical ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft'];
      const next = vertical ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight'];
      let target;
      if (previous.includes(event.key)) target = (index - 1 + tabs.length) % tabs.length;
      if (next.includes(event.key)) target = (index + 1) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target !== undefined) { event.preventDefault(); activate(tabs[target], true); }
    });
  });
}
wireTabs('.scene-tabs [role=tab]', tab => {
  activeScene = tab.dataset.scene;
  const scene = sceneData[activeScene];
  evidence.dataset.scene = activeScene;
  evidence.querySelector('.evidence-word').textContent = scene.word;
  document.getElementById('scene-title').textContent = scene.title;
  document.getElementById('scene-description').textContent = scene.text;
  still.src = scene.image; still.alt = scene.alt;
  document.getElementById('gameplay-panel').setAttribute('aria-labelledby', tab.id);
  const showVideo = activeScene === 'combat' && !videoFailed;
  video.hidden = !showVideo; videoToggle.hidden = !showVideo; still.hidden = showVideo;
  if (showVideo) playIfAllowed(); else video.pause();
}, true);
wireTabs('.world-tabs [role=tab]', tab => {
  const world = worldData[tab.dataset.world];
  document.getElementById('world-act').textContent = world.act;
  document.getElementById('world-name').textContent = world.name;
  document.getElementById('world-description').textContent = world.text;
  document.getElementById('world-index').textContent = world.index;
  const picture = document.getElementById('world-image');
  picture.src = world.image; picture.alt = world.alt;
  document.getElementById('world-panel').setAttribute('aria-labelledby', tab.id);
});

const dialog = document.querySelector('.screenshot-dialog');
let videoWasPlaying = false;
document.getElementById('capture-expand').addEventListener('click', () => {
  const scene = sceneData[activeScene];
  const picture = document.getElementById('dialog-image');
  picture.src = activeScene === 'combat' ? 'assets/v2/gameplay-poster.webp' : scene.image;
  picture.alt = scene.alt;
  document.getElementById('dialog-caption').textContent = `${scene.title} — 실제 개발 빌드 화면`;
  videoWasPlaying = !video.paused;
  video.pause();
  dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { if (videoWasPlaying) playIfAllowed(); });
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});

const poster = document.querySelector('.poster');
const character = document.querySelector('.hero-character');
let frame = 0;
poster.addEventListener('pointermove', event => {
  if (motionPreference.matches || event.pointerType !== 'mouse' || window.innerWidth < 761) return;
  cancelAnimationFrame(frame);
  const bounds = poster.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  frame = requestAnimationFrame(() => { character.style.transform = `translate(${x * 12}px, ${y * 9}px) rotate(${x * -1.2}deg)`; });
});
poster.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); character.style.transform = ''; });

for (const button of document.querySelectorAll('[data-store]')) {
  const key = button.dataset.store;
  if (!STORE_URLS[key]) continue;
  let url;
  try { url = new URL(STORE_URLS[key]); } catch { continue; }
  const valid = url.protocol === 'https:' && (key === 'appStore'
    ? url.hostname === 'apps.apple.com' && /\/id\d+/.test(url.pathname)
    : url.hostname === 'play.google.com' && url.pathname === '/store/apps/details' && Boolean(url.searchParams.get('id')));
  if (!valid) continue;
  const link = document.createElement('a');
  link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.innerHTML = button.innerHTML;
  link.querySelector('small').textContent = '다운로드하기';
  link.setAttribute('aria-label', `${key === 'appStore' ? 'App Store' : 'Google Play'}에서 냥브로 다운로드`);
  button.replaceWith(link);
}
