// Native disclosure and links keep language selection usable without JavaScript.
document.querySelectorAll('.site-language').forEach((picker) => {
  const trigger = picker.querySelector('summary');
  document.addEventListener('pointerdown', (event) => {
    if (picker.open && !picker.contains(event.target)) picker.open = false;
  });
  picker.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && picker.open) {
      picker.open = false;
      trigger.focus();
    }
  });
  picker.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false;
  });
});
