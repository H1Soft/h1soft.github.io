document.addEventListener('click', event => {
  for (const picker of document.querySelectorAll('.sv-language[open]')) {
    if (!picker.contains(event.target)) picker.open = false;
  }
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  for (const picker of document.querySelectorAll('.sv-language[open]')) {
    picker.open = false;
    picker.querySelector('summary').focus();
  }
});
