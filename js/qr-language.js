document.addEventListener('DOMContentLoaded', () => {
  const picker = document.querySelector('.qr-language-picker');
  if (!picker) return;
  const trigger = picker.querySelector('summary');
  const searchRow = picker.querySelector('.qr-language-search');
  const search = searchRow.querySelector('input');
  const options = [...picker.querySelectorAll('.qr-language-option')];
  const empty = picker.querySelector('.qr-language-empty');
  const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  searchRow.hidden = false;
  search.addEventListener('input', () => {
    const query = normalize(search.value.trim());
    options.forEach(option => { option.hidden = !normalize(option.dataset.search).includes(query); });
    empty.hidden = options.some(option => !option.hidden);
  });
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape' && picker.open) {
      event.preventDefault();
      picker.open = false;
      trigger.focus();
    }
  });
  document.addEventListener('click', event => {
    if (picker.open && !picker.contains(event.target)) picker.open = false;
  });
  picker.addEventListener('toggle', () => {
    if (!picker.open) {
      search.value = '';
      options.forEach(option => { option.hidden = false; });
      empty.hidden = true;
    }
  });
});
