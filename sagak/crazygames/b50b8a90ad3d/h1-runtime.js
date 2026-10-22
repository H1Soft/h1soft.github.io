// CrazyGames Sagak Basic ONLY. No local fallback after cloud failure.
(() => {
  const storageNotes = {
    ko:'게스트 기록은 이 브라우저에, 로그인한 기록은 CrazyGames 계정에 저장돼요.',
    en:'Guest progress stays in this browser. Signed-in progress is saved to your CrazyGames account.',
    ja:'ゲストの記録はこのブラウザに、ログイン後の記録はCrazyGamesアカウントに保存されます。',
    de:'Gastfortschritt bleibt in diesem Browser. Angemeldeter Fortschritt wird im CrazyGames-Konto gespeichert.',
    es:'El progreso de invitado queda en este navegador. Al iniciar sesión, se guarda en tu cuenta de CrazyGames.',
    fa:'پیشرفت مهمان در این مرورگر و پس از ورود در حساب CrazyGames ذخیره می‌شود.',
    fr:'La progression des invités reste dans ce navigateur. Une fois connecté, elle est enregistrée sur votre compte CrazyGames.',
    id:'Progres tamu tersimpan di browser ini. Setelah masuk, progres disimpan di akun CrazyGames.',
    it:'I progressi degli ospiti restano in questo browser. Dopo l’accesso vengono salvati nel tuo account CrazyGames.',
    nl:'Gastvoortgang blijft in deze browser. Na aanmelden wordt voortgang opgeslagen in je CrazyGames-account.',
    pl:'Postępy gościa pozostają w tej przeglądarce. Po zalogowaniu są zapisywane na koncie CrazyGames.',
    pt:'O progresso de visitante fica neste navegador. Ao entrar, ele é salvo na sua conta CrazyGames.',
    ru:'Прогресс гостя хранится в этом браузере. После входа он сохраняется в аккаунте CrazyGames.',
    tr:'Misafir ilerlemesi bu tarayıcıda kalır. Giriş yaptıktan sonra ilerleme CrazyGames hesabına kaydedilir.',
    vi:'Tiến trình của khách được lưu trong trình duyệt này. Sau khi đăng nhập, tiến trình được lưu vào tài khoản CrazyGames.',
    'zh-CN':'访客进度保存在此浏览器中，登录后的进度保存在 CrazyGames 账户中。',
    'zh-TW':'訪客進度保存在此瀏覽器中，登入後的進度保存在 CrazyGames 帳戶中。',
  };
  let initialized = false, playing = false, loaded = false, sent = false, muted = false;
  const sessionKeys = new Set(['sagak:versus.json', 'sagak:versus-cache.json']);
  function settings(value) {
    muted = value?.muteAudio === true;
    window.sagak?.platformMute(muted);
  }
  function sync() {
    if (!initialized || !loaded) return;
    const active = playing && !document.hidden;
    if (active === sent) return;
    window.CrazyGames.SDK.game[active ? 'gameplayStart' : 'gameplayStop']();
    sent = active;
  }
  const domReady = document.readyState === 'loading'
    ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once: true}))
    : Promise.resolve();
  const ready = domReady.then(async () => {
    const sdk = window.CrazyGames?.SDK;
    if (!sdk?.init) throw new Error('CrazyGames SDK unavailable');
    await sdk.init();
    if (!sdk.data || !sdk.game) throw new Error('CrazyGames modules unavailable');
    sdk.data.getItem('sagak:profile.json');
    for (const key of sessionKeys) window.sessionStorage.getItem(key);
    settings(sdk.game.settings);
    sdk.game.addSettingsChangeListener(settings);
    sdk.game.loadingStart();
    initialized = true;
    return true;
  }).catch(error => {
    console.warn('CrazyGames startup blocked to preserve existing saves', error);
    return false;
  });
  window.h1Distribution = Object.freeze({
    platform: 'crazygames', app: 'sagak', ready,
    get identityReady() { return initialized; },
    get audioMuted() { return muted; },
    storageNotice(language) { return storageNotes[language] || storageNotes[language.split('-')[0]] || storageNotes.en; },
    storage: Object.freeze({
      getItem(key) {
        if (!initialized) throw new Error('Uninitialized CrazyGames storage');
        if (key === 'sagak:profile.json') return window.CrazyGames.SDK.data.getItem(key);
        if (sessionKeys.has(key)) return window.sessionStorage.getItem(key);
        throw new Error('Unreviewed storage key');
      },
      setItem(key, value) {
        if (!initialized) throw new Error('Uninitialized CrazyGames storage');
        if (typeof value !== 'string') throw new Error('Storage value must be a string');
        if (key === 'sagak:profile.json') return window.CrazyGames.SDK.data.setItem(key, value);
        if (sessionKeys.has(key)) return window.sessionStorage.setItem(key, value);
        throw new Error('Unreviewed storage key');
      },
    }),
    gameplay(active) { playing = !!active; sync(); },
    loaded() {
      if (!initialized || loaded) return;
      window.CrazyGames.SDK.game.loadingStop();
      loaded = true; sync();
    },
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.sagak?.audioStop();
    sync();
  });
})();
