// CrazyGames-only first-run locale. Manual in-game choices remain authoritative.
(() => {
  'use strict';
  const languages = new Set(['en','ko','ja','de','es','fa','fr','id','it','nl','pl','pt','ru','tr','vi','zh']);
  function normalize(value) {
    try {
      const locale = new Intl.Locale(String(value || '').replaceAll('_', '-'));
      if (!languages.has(locale.language)) return 'en-US';
      if (locale.language === 'zh') return locale.script === 'Hant' || ['TW','HK','MO'].includes(locale.region) ? 'zh-TW' : 'zh-CN';
      if (locale.language === 'pt') return locale.region === 'BR' ? 'pt-BR' : 'pt-PT';
      return locale.baseName;
    } catch (_) { return 'en-US'; }
  }
  function install(sdk, app) {
    const platformLocale = normalize(sdk.user?.systemInfo?.locale);
    const effective = () => {
      const tag = app === 'sudoku' && window.__customLocale ? window.__customLocale : platformLocale;
      return app === 'sudoku' ? sudokuComposeLocale(tag) : tag;
    };
    // This Navigator belongs only to this isolated game's iframe. Engine locale
    // detection occurs after SDK.ready; no device setting or other app is changed.
    Object.defineProperties(window.navigator, {
      language: { configurable: true, get: effective },
      languages: { configurable: true, get: () => Object.freeze([effective()]) },
    });
    return platformLocale;
  }
  window.h1CrazyGamesLocale = Object.freeze({ normalize, install });
})();
