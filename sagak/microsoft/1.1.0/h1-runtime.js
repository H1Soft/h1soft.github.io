// Microsoft-only Sagak storage; the public web edition uses different keys.
(() => {
  'use strict';
  if (window.h1Distribution) throw new Error('A distribution adapter is already installed');
  const prefix = 'h1.microsoft.';
  const keyFor = key => {
    if (typeof key !== 'string' || !key.startsWith('sagak:')) {
      throw new Error('Invalid Microsoft Sagak storage key');
    }
    return prefix + key;
  };
  const storage = Object.freeze({
    getItem(key) { return localStorage.getItem(keyFor(key)); },
    setItem(key, value) { localStorage.setItem(keyFor(key), value); },
    removeItem(key) { localStorage.removeItem(keyFor(key)); }
  });
  window.h1Distribution = Object.freeze({
    platform: 'microsoft', app: 'sagak', version: '1.1.0', storage,
    gameplay() {}, loaded() {}
  });
})();
