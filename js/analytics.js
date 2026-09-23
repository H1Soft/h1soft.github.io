// Load visit analytics only after the visitor opts in. No advertising tags.
(() => {
  if (location.hostname !== 'h1soft.github.io' || location.pathname.startsWith('/metrics')) return;
  const id = 'G-X522MQ0TMG', key = 'h1soft.analytics.v1';
  const ko = document.documentElement.lang.startsWith('ko');
  let choice = null, started = false;
  try { choice = localStorage.getItem(key); } catch {}
  const start = () => {
    if (started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    gtag('consent', 'update', {analytics_storage:'granted'});
    gtag('js', new Date());
    let referrer = '';
    try { const u = new URL(document.referrer); referrer = u.origin + u.pathname; } catch {}
    gtag('config', id, {allow_google_signals:false, allow_ad_personalization_signals:false, cookie_expires:15552000, cookie_update:false, page_location:location.origin + location.pathname, page_referrer:referrer});
    const tag = document.createElement('script');
    tag.async = true; tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(tag);
  };
  const panel = document.createElement('section');
  panel.setAttribute('aria-label', ko ? '방문 통계 설정' : 'Visit analytics settings');
  panel.style.cssText = 'position:fixed;inset:auto 16px 16px;z-index:9999;max-width:560px;margin:auto;padding:18px;background:#fff;color:#17201d;border:1px solid #b9c3bd;border-radius:14px;box-shadow:0 8px 30px #0002;font:14px/1.6 system-ui;';
  const text = document.createElement('p');
  text.textContent = ko ? '사이트 개선을 위해 Google Analytics 방문 통계를 허용하시겠어요? 동의한 경우에만 방문 경로·기기 정보와 통계 쿠키를 사용합니다.' : 'Allow Google Analytics to help improve this site? Page visits, device information and analytics cookies are used only with your consent.';
  panel.append(text);
  const more = document.createElement('a');
  more.href = '/analytics-privacy/'; more.textContent = ko ? '자세히 보기' : 'Details';
  more.style.cssText = 'display:inline-block;margin:8px;color:#174e42;text-decoration:underline'; panel.append(more);
  const settings = document.createElement('button');
  settings.textContent = ko ? '통계 설정' : 'Analytics settings';
  settings.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:9998;padding:5px 9px;border:1px solid #b9c3bd;border-radius:6px;background:#fff;color:#17201d;font:12px system-ui;';
  settings.onclick = () => { panel.hidden = false; };
  const save = (value) => {
    try { localStorage.setItem(key, value); } catch {}
    panel.hidden = true;
    if (value === 'yes') start();
    else if (started) {
      window['ga-disable-' + id] = true;
      const names = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga(?:_|$)/.test(n));
      for (const name of names) for (const domain of ['', '; domain=h1soft.github.io', '; domain=.h1soft.github.io']) document.cookie = name + '=; max-age=0; path=/' + domain;
      location.reload();
    }
  };
  for (const [value, label] of [['no', ko ? '거절' : 'Decline'], ['yes', ko ? '허용' : 'Allow']]) {
    const btn = document.createElement('button'); btn.textContent = label;
    btn.style.cssText = 'margin:8px;padding:8px 18px;border:1px solid #64756d;border-radius:8px;background:#fff;color:#17201d;cursor:pointer;font:inherit';
    btn.onclick = () => save(value); panel.append(btn);
  }
  document.body.append(settings, panel);
  panel.hidden = choice === 'yes' || choice === 'no';
  if (choice === 'yes') start();
})();
