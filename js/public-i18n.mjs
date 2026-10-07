import './store-link-observer.mjs?v=20261007';
// Preserve the current section when switching languages; URL links still work without JS.
for (const link of document.querySelectorAll('.site-language-list a')) {
  if (location.hash) link.hash = location.hash;
}
for (const menu of document.querySelectorAll('.site-languages')) {
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
}
