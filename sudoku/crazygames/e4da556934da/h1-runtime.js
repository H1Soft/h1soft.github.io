// Compose 1.9's non-composable getString() assumes Intl.Locale.region exists.
// Keep the user's chosen language/script, adding only a missing region.
function sudokuComposeLocale(tag) {
  try {
    const locale = new Intl.Locale(String(tag).replaceAll('_', '-'));
    return locale.region ? locale.baseName : new Intl.Locale(locale.baseName, {
      // The original app exposes pt (European Portuguese) separately from pt-BR.
      region: locale.language === 'pt' ? 'PT' : (locale.maximize().region || 'US'),
    }).baseName;
  } catch (_) { return 'en-US'; }
}

// CrazyGames Sudoku ONLY. Loaded after the official v3 SDK and before the engine.
// The engine awaits ready; failed cloud initialization must never become a blank local save.
(() => {
  'use strict';
  const keys = new Set(['sudoku:database', 'sudoku:preferences', 'sudoku:language']);
  let initialized = false, loaded = false, playing = false, sent = false;
  let muted = false;
  const sdk = window.CrazyGames?.SDK;
  const storageErrors = {
    ko: '저장 데이터를 불러올 수 없어요. 연결을 확인하고 다시 열어 주세요.',
    en: 'Saved data could not be loaded. Check your connection and reopen the game.',
    ja: 'セーブデータを読み込めません。接続を確認してゲームを開き直してください。',
    de: 'Speicherdaten konnten nicht geladen werden. Prüfe die Verbindung und öffne das Spiel erneut.',
    es: 'No se pudieron cargar los datos guardados. Revisa tu conexión y vuelve a abrir el juego.',
    fa: 'داده‌های ذخیره‌شده بارگیری نشد. اتصال را بررسی کنید و بازی را دوباره باز کنید.',
    fr: 'Impossible de charger la sauvegarde. Vérifiez votre connexion et rouvrez le jeu.',
    id: 'Data tersimpan tidak dapat dimuat. Periksa koneksi dan buka kembali game.',
    it: 'Impossibile caricare i dati salvati. Controlla la connessione e riapri il gioco.',
    nl: 'Opgeslagen gegevens konden niet worden geladen. Controleer je verbinding en open het spel opnieuw.',
    pl: 'Nie udało się wczytać zapisanych danych. Sprawdź połączenie i otwórz grę ponownie.',
    pt: 'Não foi possível carregar os dados guardados. Verifica a ligação e volta a abrir o jogo.',
    'pt-BR': 'Não foi possível carregar os dados salvos. Verifique a conexão e abra o jogo novamente.',
    ru: 'Не удалось загрузить сохранение. Проверьте подключение и снова откройте игру.',
    tr: 'Kayıtlı veriler yüklenemedi. Bağlantınızı kontrol edip oyunu yeniden açın.',
    vi: 'Không thể tải dữ liệu đã lưu. Kiểm tra kết nối rồi mở lại trò chơi.',
    'zh-CN': '无法加载存档。请检查网络连接后重新打开游戏。',
    'zh-TW': '無法載入存檔。請檢查網路連線後重新開啟遊戲。',
  };
  function dataKey(key) {
    if (!initialized || !keys.has(key)) throw new Error('Uninitialized or unreviewed Sudoku save');
    return key;
  }
  function sync() {
    if (!initialized) return;
    const active = loaded && playing && !document.hidden;
    if (active === sent) return;
    sent = active;
    sdk.game[active ? 'gameplayStart' : 'gameplayStop']();
  }
  function settings(value) {
    muted = value?.muteAudio === true;
    if (muted) window.h1SudokuHost?.stopSound();
  }
  const ready = Promise.resolve().then(async () => {
    if (!sdk) throw new Error('CrazyGames SDK unavailable');
    await sdk.init();
    if (!sdk.data) throw new Error('CrazyGames Data Module unavailable');
    // Read every persisted field before exposing the store to the engine.
    for (const key of keys) sdk.data.getItem(key);
    const language = sdk.data.getItem('sudoku:language');
    if (language) window.__customLocale = language;
    settings(sdk.game.settings);
    sdk.game.addSettingsChangeListener(settings);
    sdk.game.loadingStart();
    initialized = true;
  });
  window.h1Distribution = Object.freeze({
    app: 'sudoku', platform: 'crazygames', ready,
    storageErrorMessage() {
      const tag = String(window.__customLocale || navigator.language || 'en').replaceAll('_', '-');
      const key = /^zh-(TW|HK|Hant)/i.test(tag) ? 'zh-TW' : /^zh/i.test(tag) ? 'zh-CN' : tag;
      return storageErrors[key] || storageErrors[key.split('-')[0]] || storageErrors.en;
    },
    get identityReady() { return initialized; },
    get audioMuted() { return muted || document.hidden; },
    storage: Object.freeze({
      getItem(key) { return sdk.data.getItem(dataKey(key)); },
      setItem(key, value) { return sdk.data.setItem(dataKey(key), value); },
    }),
    gameplay(active) { playing = !!active; sync(); },
    loaded() {
      if (loaded) return;
      loaded = true;
      sdk.game.loadingStop();
      window.h1Navigation.loaded();
      document.getElementById('loading')?.remove();
      sync();
    },
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.h1SudokuHost?.stopSound();
    sync();
  });
})();

(() => {
  'use strict';
  const host=document.getElementById('h1-safe-host');
  if(host&&typeof ResizeObserver==='function')new ResizeObserver(()=>window.dispatchEvent(new Event('resize'))).observe(host);
  const originalLanguage=Object.getOwnPropertyDescriptor(Navigator.prototype,'language');
  Object.defineProperty(Navigator.prototype,'language',{...originalLanguage,get(){return sudokuComposeLocale(window.__customLocale||originalLanguage.get.call(this));}});
  const originalLanguages=Object.getOwnPropertyDescriptor(Navigator.prototype,'languages');
  Object.defineProperty(Navigator.prototype,'languages',{...originalLanguages,get(){return (window.__customLocale?[window.__customLocale]:originalLanguages.get.call(this)).map(sudokuComposeLocale);}});
  function chrome(dark){document.documentElement.style.setProperty('--h1-chrome-background',dark?'#100F0F':'#FFFCF0');document.documentElement.style.colorScheme=dark?'dark':'light';}
  function language(tag) {
    const normalized = tag.replaceAll('_','-');
    window.h1Distribution.storage.setItem('sudoku:language',normalized);
    if (window.__customLocale !== normalized) { window.__customLocale=normalized; window.dispatchEvent(new Event('languagechange')); }
  }
  function locale(english) { return english ? 'en-US' : window.__customLocale || navigator.languages[0] || 'en-US'; }
  function dateText(date, pattern, english) {
    const d = new Date(date + 'T12:00:00Z');
    const opts = {timeZone:'UTC'};
    if (pattern.includes('yyyy')) opts.year='numeric';
    if (pattern.includes('MMMM')) opts.month='long'; else if(pattern.includes('MMM'))opts.month='short';
    if (pattern.includes('EEEE')) opts.weekday='long';
    if (pattern.includes('d')) opts.day='numeric';
    return new Intl.DateTimeFormat(locale(english),opts).format(d);
  }
  function weekText(day, style) {
    return new Intl.DateTimeFormat(locale(false),{timeZone:'UTC',weekday: style==='full'?'long':style==='narrow'?'narrow':'short'}).format(new Date(Date.UTC(2026,9,19+day-1,12)));
  }
  async function save(data,fileName,mimeType) {
    const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
    const url=URL.createObjectURL(new Blob([bytes],{type:mimeType})),anchor=document.createElement('a');
    anchor.href=url;anchor.download=fileName;document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async function exportText(text,name) {
    const bytes = new TextEncoder().encode(text); let binary='';
    for (let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return save(btoa(binary),name,'application/json');
  }
  function importText() {
    return new Promise((resolve,reject) => {
      const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
      let id;
      const cleanup=()=>{input.remove();if(id)window.h1Navigation.remove(id);};
      input.addEventListener('change',async()=>{
        const file=input.files?.[0]; cleanup();
        if(!file){resolve(null);return;}
        try { if(file.size>32*1024*1024)throw new Error('Backup is too large');resolve(await file.text()); }catch(e){reject(e);}
      },{once:true});
      input.addEventListener('cancel',()=>{cleanup();resolve(null);},{once:true});
      id=window.h1Navigation.register(()=>{cleanup();resolve(null);});
      document.body.append(input);input.click();
    });
  }
  const playing=new Set();
  function playSound(name,rate) {
    if(window.h1Distribution.audioMuted)return;
    if(!['tap','error','chime','complete'].includes(name))return;
    const audio=new Audio(new URL(`sfx/sfx_${name}.wav`,document.baseURI));
    audio.playbackRate=Math.max(.25,Math.min(4,rate));playing.add(audio);
    audio.addEventListener('ended',()=>playing.delete(audio),{once:true});
    audio.play().catch(()=>playing.delete(audio));
  }
  function stopSound(){for(const audio of playing){audio.pause();}playing.clear();}
  async function exportCard(value,name) {
    const card=JSON.parse(value);const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;
    const g=canvas.getContext('2d');if(!g)throw new Error('Image export unavailable');
    g.fillStyle='#F2EAD9';g.fillRect(0,0,1080,1440);g.fillStyle='#FFFDF8';g.beginPath();g.roundRect(80,130,920,990,20);g.fill();
    g.save();g.translate(124,174);g.beginPath();g.rect(0,0,832,624);g.clip();
    card.ops.forEach((op,index)=>{
      const v=op.values;g.fillStyle=op.color;g.strokeStyle=op.color;g.beginPath();
      switch(op.type){
        case 'block':g.rect(v[0]*832,v[1]*624,(v[2]-v[0])*832,(v[3]-v[1])*624);break;
        case 'dot':g.arc(v[0]*832,v[1]*624,v[2]*832,0,Math.PI*2);break;
        case 'tri':g.moveTo(v[0]*832,v[1]*624);g.lineTo(v[2]*832,v[3]*624);g.lineTo(v[4]*832,v[5]*624);g.closePath();break;
        case 'arch':{const l=v[0]*832,r=v[2]*832,t=v[1]*624,b=v[3]*624,radius=(r-l)/2;g.moveTo(l,b);g.lineTo(l,t+radius);g.arc((l+r)/2,t+radius,radius,Math.PI,0);g.lineTo(r,b);g.closePath();break;}
        case 'seg':g.moveTo(v[0]*832,v[1]*624);g.lineTo(v[2]*832,v[3]*624);g.lineWidth=v[4]*832;g.stroke();return;
        default:throw new Error('Unsupported postcard operation');
      }
      g.fill();if(card.tier===1&&index>0){g.strokeStyle='rgba(31,41,51,.45)';g.lineWidth=4;g.stroke();}
    });g.restore();
    await document.fonts.ready;
    function centered(text,y,size,serif=false){g.font=`${size}px ${serif?'Georgia,serif':'sans-serif'}`;while(g.measureText(text).width>840&&size>18){g.font=`${--size}px ${serif?'Georgia,serif':'sans-serif'}`;}g.textAlign='center';g.fillText(text,540,y);}
    g.fillStyle='#1F2933';centered(card.name,905,64,true);centered(card.meta,975,30);
    for(let tier=0;tier<3;tier++){g.fillStyle=card.tier>tier?'#B98A2F':'#D8D2C7';g.beginPath();g.roundRect(448+tier*66,1030,52,12,6);g.fill();}
    g.fillStyle='#7C7B76';centered('SUDOKU VOYAGE',1300,30);
    return save(canvas.toDataURL('image/png').split(',')[1],name,'image/png');
  }
  window.h1SudokuHost=Object.freeze({chrome,language,dateText,weekText,exportText,importText,playSound,stopSound,exportCard});
})();
