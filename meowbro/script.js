// Fill in verified product URLs once the game is listed. Empty entries stay disabled.
const STORE_URLS = { appStore: '', googlePlay: '' };

const weapons = {
  gun: { title: '거리를 두고, 시원하게!', style: '원거리 · 연사', description: '다가오는 적을 향해 쏟아지는 탄환. 전장을 누비며 공격을 이어가고, 위기의 순간엔 탄막 폭풍을 터뜨려요.', finale: '탄막 폭풍' },
  sword: { title: '가까이 오면, 한 방이다냥!', style: '근접 · 참격', description: '적의 빈틈을 파고드는 묵직한 검격. 대시로 공격을 피하고 거리를 좁혀, 천지 가르기로 전장을 가로질러요.', finale: '천지 가르기' },
  staff: { title: '이 작은 발에서, 거대한 마법!', style: '마법 · 광역', description: '지팡이 끝에서 펼쳐지는 화려한 마법. 나에게 맞는 성장 방향을 고르고, 유성우로 몰려오는 적을 상대해요.', finale: '유성우' },
};

const tabs = [...document.querySelectorAll('[data-weapon]')];
function selectWeapon(tab, focus = false) {
  const choice = weapons[tab.dataset.weapon];
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  document.getElementById('weapon-title').textContent = choice.title;
  document.getElementById('weapon-style').textContent = choice.style;
  document.getElementById('weapon-description').textContent = choice.description;
  document.getElementById('weapon-finale').textContent = choice.finale;
  document.getElementById('weapon-panel').setAttribute('aria-labelledby', tab.id);
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectWeapon(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectWeapon(tabs[next], true); }
  });
});

const dialog = document.querySelector('.screenshot-dialog');
document.querySelectorAll('[data-full]').forEach(button => button.addEventListener('click', () => {
  const picture = document.getElementById('dialog-image');
  picture.src = button.dataset.full;
  picture.alt = button.querySelector('img').alt;
  document.getElementById('dialog-caption').textContent = button.dataset.caption;
  dialog.showModal();
}));
document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});

document.querySelectorAll('[data-store]').forEach(button => {
  const key = button.dataset.store;
  const value = STORE_URLS[key];
  if (!value) return;
  let url;
  try { url = new URL(value); } catch { return; }
  const valid = url.protocol === 'https:' && (key === 'appStore'
    ? url.hostname === 'apps.apple.com' && /\/id\d+/.test(url.pathname)
    : url.hostname === 'play.google.com' && url.pathname === '/store/apps/details' && Boolean(url.searchParams.get('id')));
  if (!valid) return;
  const link = document.createElement('a');
  link.className = button.className;
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.innerHTML = button.innerHTML;
  link.querySelector('small').textContent = '다운로드하기';
  link.setAttribute('aria-label', `${key === 'appStore' ? 'App Store' : 'Google Play'}에서 냥브로 다운로드`);
  button.replaceWith(link);
});
