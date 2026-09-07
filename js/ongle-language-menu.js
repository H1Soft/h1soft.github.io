document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-language-picker]').forEach(picker => {
    const button = picker.querySelector('button');
    const panel = picker.querySelector('nav');
    const close = () => { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); };
    button.addEventListener('click', () => {
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', event => { if (!picker.contains(event.target)) close(); });
    picker.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) { close(); button.focus(); }
    });
  });
});
