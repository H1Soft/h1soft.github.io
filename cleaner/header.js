const productsButton = document.querySelector('#nav-products');
const productsMenu = document.querySelector('#nav-dropdown');
const languagePicker = document.querySelector('.qr-language-picker');
const languageTrigger = languagePicker.querySelector('summary');

function closeProducts(restoreFocus = false) {
  productsMenu.hidden = true;
  productsButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus) productsButton.focus();
}
productsButton.addEventListener('click', () => {
  const opening = productsMenu.hidden;
  productsMenu.hidden = !opening;
  productsButton.setAttribute('aria-expanded', String(opening));
  if (opening) languagePicker.open = false;
});
productsButton.addEventListener('keydown', event => {
  if (event.key !== 'ArrowDown') return;
  event.preventDefault();
  productsMenu.hidden = false;
  productsButton.setAttribute('aria-expanded', 'true');
  languagePicker.open = false;
  productsMenu.querySelector('a').focus();
});
languagePicker.addEventListener('toggle', () => {
  if (languagePicker.open) closeProducts();
});
document.addEventListener('click', event => {
  if (!productsMenu.contains(event.target) && !productsButton.contains(event.target)) closeProducts();
  if (!languagePicker.contains(event.target)) languagePicker.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (languagePicker.open) {
    event.preventDefault();
    languagePicker.open = false;
    languageTrigger.focus();
  } else if (!productsMenu.hidden) {
    event.preventDefault();
    closeProducts(true);
  }
});
// Keep the current section when moving between the two static language pages.
document.querySelectorAll('.qr-language-option').forEach(link => {
  const update = () => { link.hash = window.location.hash; };
  update(); window.addEventListener('hashchange', update);
});
