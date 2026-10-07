// Match the website language to an App Store storefront that supports it.
// Apple does not offer Persian metadata; those links explicitly fall back to English.
const appleLocales = {
  ar: ['sa', 'ar'], cs: ['cz', 'cs'], da: ['dk', 'da'], de: ['de', 'de'],
  el: ['gr', 'el'], en: ['us', 'en-US'], es: ['es', 'es-ES'],
  fa: ['us', 'en-US'], fi: ['fi', 'fi'], fr: ['fr', 'fr-FR'],
  he: ['il', 'he'], hi: ['in', 'hi'], hu: ['hu', 'hu'], id: ['id', 'id'],
  it: ['it', 'it'], ja: ['jp', 'ja'], ko: ['kr', 'ko'], ms: ['my', 'ms'],
  nb: ['no', 'no'], nl: ['nl', 'nl'], pl: ['pl', 'pl'], pt: ['br', 'pt-BR'],
  ro: ['ro', 'ro'], ru: ['ru', 'ru'], sv: ['se', 'sv'], th: ['th', 'th'],
  tr: ['tr', 'tr'], uk: ['ua', 'uk'], vi: ['vn', 'vi'],
  'en-gb': ['gb', 'en-GB'], 'pt-pt': ['pt', 'pt-PT'],
  'zh-cn': ['cn', 'zh-Hans'], 'zh-hans': ['cn', 'zh-Hans'],
  'zh-tw': ['tw', 'zh-Hant'], 'zh-hant': ['tw', 'zh-Hant'],
};

/** @param {string} href @param {string} lang */
export function localizeStoreUrl(href, lang) {
  const url = new URL(href);
  const normalized = (lang || 'en').toLowerCase().replaceAll('_', '-');
  const locale = { in: 'id', 'zh-rcn': 'zh-cn', 'zh-rtw': 'zh-tw' }[normalized] || normalized;
  const base = locale.split('-')[0];
  if (url.hostname === 'apps.apple.com' || url.hostname === 'itunes.apple.com') {
    const [country, language] = appleLocales[locale] || appleLocales[base] || appleLocales.en;
    const appPath = url.pathname.match(/(?:\/[a-z]{2})?(\/app\/.*)$/);
    if (!appPath) return href;
    url.pathname = `/${country}${appPath[1]}`;
    url.searchParams.set('l', language);
  } else if (url.hostname === 'play.google.com') {
    const language = {
      'zh-hans': 'zh-CN', 'zh-cn': 'zh-CN', 'zh-hant': 'zh-TW', 'zh-tw': 'zh-TW',
      pt: 'pt-BR', 'pt-br': 'pt-BR', 'pt-pt': 'pt-PT', nb: 'no',
    }[locale] || base;
    url.searchParams.set('hl', language);
  } else {
    return href;
  }
  return url.href;
}
