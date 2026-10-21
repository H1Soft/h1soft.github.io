// Microsoft-only host. Original native saves and other store distributions are isolated.
(() => {
  if (window.h1Distribution || window.h1MeowbroStorage) throw Error('A distribution adapter is already installed');
  const prefix = 'h1soft:microsoft:meowbro:';
  const storageMessages = {
    en: 'Saved progress is unavailable. Close and reopen the app to try again.',
    ko: '저장 기록에 접근할 수 없습니다. 앱을 닫았다 다시 열어 주세요.',
    ja: '保存データにアクセスできません。アプリを閉じてから再度開いてください。',
    de: 'Gespeicherte Fortschritte sind nicht verfügbar. Schließe die App und öffne sie erneut.',
    es: 'No se puede acceder al progreso guardado. Cierra la aplicación y vuelve a abrirla.',
    fr: 'La progression sauvegardée est inaccessible. Fermez puis rouvrez l’application.',
    it: 'I progressi salvati non sono disponibili. Chiudi e riapri l’app.',
    nl: 'Opgeslagen voortgang is niet beschikbaar. Sluit de app en open deze opnieuw.',
    pl: 'Zapisane postępy są niedostępne. Zamknij i ponownie otwórz aplikację.',
    pt: 'Não foi possível acessar o progresso salvo. Feche e abra o aplicativo novamente.',
    ru: 'Сохранённый прогресс недоступен. Закройте и снова откройте приложение.',
    tr: 'Kayıtlı ilerlemeye erişilemiyor. Uygulamayı kapatıp yeniden açın.',
    id: 'Progres tersimpan tidak dapat diakses. Tutup dan buka kembali aplikasi.',
    vi: 'Không thể truy cập tiến trình đã lưu. Hãy đóng rồi mở lại ứng dụng.',
    fa: 'دسترسی به پیشرفت ذخیره‌شده ممکن نیست. برنامه را ببندید و دوباره باز کنید.',
    zh: '无法访问保存的进度。请关闭应用后重新打开。',
    'zh-TW': '無法存取儲存的進度。請關閉應用程式後重新開啟。',
  };
  window.h1StorageFailureMessage = () => {
    const locale = (window.navigator?.language || 'en').replace('_', '-');
    if (/^zh-(TW|HK|Hant)/i.test(locale)) return storageMessages['zh-TW'];
    return storageMessages[locale.split('-')[0].toLowerCase()] || storageMessages.en;
  };
  const keys = new Set(['profile_a', 'profile_b', 'run_a', 'run_b'].map(s => 'user://nyangbro_' + s + '.json'));
  let initialized = false;
  const ready = Promise.resolve().then(() => {
    for (const key of keys) window.localStorage.getItem(prefix + key);
    const probe = prefix + 'write-probe';
    window.localStorage.setItem(probe, '1');
    if (window.localStorage.getItem(probe) !== '1') throw Error('Durable storage is unavailable');
    window.localStorage.removeItem(probe);
    initialized = true;
    return true;
  }).catch(() => false);
  function check(key) {
    if (!initialized || !keys.has(key)) throw Error('Uninitialized or unreviewed save key');
  }
  window.h1MeowbroStorage = Object.freeze({
    read(key) { check(key); return window.localStorage.getItem(prefix + key) ?? ''; },
    exists(key) { check(key); return window.localStorage.getItem(prefix + key) !== null; },
    write(key, value) {
      check(key);
      try {
        const data = JSON.parse(value);
        if (data.schema_version !== 1 || !Number.isInteger(data.generation) || data.generation < 1 || typeof data.data_json !== 'string' || !/^[a-f0-9]{64}$/.test(data.checksum)) return false;
        window.localStorage.setItem(prefix + key, value);
        return window.localStorage.getItem(prefix + key) === value;
      } catch { return false; }
    },
  });
  window.h1Distribution = Object.freeze({platform: 'microsoft', app: 'meowbro', ready, loaded() {}, gameplay() {}});
})();
