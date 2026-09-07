// The native details element works without JavaScript. Enhance dismissal and keys.
document.querySelectorAll('.locale-switch').forEach((picker) => {
  const trigger = picker.querySelector('summary');
  const links = [...picker.querySelectorAll('.locale-switch__options a')];
  const close = (restoreFocus = false) => {
    picker.open = false;
    if (restoreFocus) trigger.focus();
  };
  document.addEventListener('click', (event) => {
    if (picker.open && !picker.contains(event.target)) close();
  });
  document.addEventListener('focusin', (event) => {
    if (picker.open && !picker.contains(event.target)) close();
  });
  picker.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && picker.open) {
      event.preventDefault(); close(true); return;
    }
    if (event.target === trigger && ['ArrowDown','ArrowUp'].includes(event.key)) {
      event.preventDefault(); picker.open = true;
      (picker.querySelector('[aria-current]') || links[0]).focus(); return;
    }
    const index = links.indexOf(document.activeElement);
    if (index < 0) return;
    const deltas = {ArrowDown: 2, ArrowUp: -2,
      ArrowRight: document.dir === 'rtl' ? -1 : 1,
      ArrowLeft: document.dir === 'rtl' ? 1 : -1};
    let next;
    if (event.key in deltas) next = (index + deltas[event.key] + links.length) % links.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = links.length - 1;
    else return;
    event.preventDefault(); links[next].focus();
  });
});
