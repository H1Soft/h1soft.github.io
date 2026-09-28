// The credential stays in the URL fragment and memory only: never analytics,
// cookies, storage, query strings, or referrer headers. DOM writes use textContent.
(() => {
  const status = document.querySelector('#share-status');
  const details = document.querySelector('#share-details');
  const time = document.querySelector('#share-time');
  const venue = document.querySelector('#share-venue');
  const expiry = document.querySelector('#share-expiry');
  const retry = document.querySelector('#share-retry');
  let pending = false;
  let generation = 0;
  let active;
  let refreshTimer;
  // Install even on an invalid or unconfigured page: a new fragment needs a
  // fresh document. Invalidate pending data before asynchronous reload starts.
  window.addEventListener('hashchange', () => {
    suspend();
    window.location.reload();
  });
  const token = window.location.hash.slice(1);
  let endpoint;
  try {
    const configured = window.GYEOL_CONFIG?.meetingShareEndpoint;
    if (!configured) throw new Error('not configured');
    const candidate = new URL(configured);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) && candidate.origin === window.location.origin;
    if ((candidate.protocol !== 'https:' && !local) || candidate.username || candidate.password || candidate.search || candidate.hash) throw new Error('invalid endpoint');
    endpoint = candidate.href;
  } catch {
    status.textContent = '공유 일정 조회가 아직 준비되지 않았어요. 일정을 공유한 지인에게 직접 확인해 주세요.';
    return;
  }
  if (!/^[0-9a-f]{64}$/.test(token)) {
    status.textContent = '공유 링크가 올바르지 않아요. 지인에게 받은 링크를 다시 열어 주세요.';
    return;
  }
  function clearDetails() {
    details.hidden = true;
    time.textContent = '';
    venue.textContent = '';
    expiry.textContent = '';
  }
  const format = value => new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short',
  }).format(new Date(value)) + ' (한국 시간)';
  const refresh = async () => {
    if (pending || document.hidden || token !== window.location.hash.slice(1)) return;
    pending = true;
    retry.disabled = true;
    retry.hidden = false;
    clearTimeout(refreshTimer);
    const version = ++generation;
    const controller = new AbortController();
    active = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    clearDetails();
    status.textContent = '최신 일정을 확인하고 있어요.';
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({token}), credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer', signal: controller.signal,
      });
      if (!response.ok) throw new Error('unavailable');
      const value = await response.json();
      if (version !== generation || document.hidden) return;
      if (!value || typeof value.publicVenue !== 'string' || value.publicVenue.length < 2 || value.publicVenue.length > 120 ||
          !Number.isFinite(Date.parse(value.scheduledAt)) || !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.now()) throw new Error('unavailable');
      time.textContent = format(value.scheduledAt);
      venue.textContent = value.publicVenue;
      expiry.textContent = format(value.expiresAt);
      details.hidden = false;
      status.textContent = '양쪽이 확인한 만남 일정이에요.';
      refreshTimer = setTimeout(refresh, Math.min(15000, Date.parse(value.expiresAt) - Date.now()));
    } catch {
      if (version !== generation) return;
      clearDetails();
      status.textContent = '일정을 확인할 수 없어요. 링크가 만료·취소되었거나 연결이 원활하지 않을 수 있어요. 지인에게 최신 일정을 확인해 주세요.';
    } finally {
      clearTimeout(timeout);
      if (version === generation) { pending = false; retry.disabled = false; active = undefined; }
    }
  };
  function suspend() {
    generation++;
    active?.abort();
    active = undefined;
    pending = false;
    clearTimeout(refreshTimer);
    clearDetails();
    status.textContent = '다시 확인하면 최신 일정을 불러와요.';
    retry.disabled = false;
  }
  retry.addEventListener('click', refresh);
  document.addEventListener('visibilitychange', () => document.hidden ? suspend() : refresh());
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pageshow', () => refresh());
  refresh();
})();
