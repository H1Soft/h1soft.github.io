// Native details supplies keyboard opening and expanded-state semantics.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.mg-locale[open]').forEach((menu) => {
    menu.open = false;
    menu.querySelector('summary').focus();
  });
});
document.addEventListener('click', (event) => {
  document.querySelectorAll('.mg-locale[open]').forEach((menu) => {
    if (!menu.contains(event.target)) menu.open = false;
  });
});
