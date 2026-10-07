import '/assets/seukscan/locales.js';
import './store-link-observer.mjs?v=20261007';
// Preserve the current section when switching languages; URL links still work without JS.
for (const link of document.querySelectorAll('.site-language-list a')) {
  if (location.hash) link.hash = location.hash;
}
