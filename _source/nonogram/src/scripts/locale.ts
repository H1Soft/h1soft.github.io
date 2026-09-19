const banner = document.querySelector<HTMLElement>('[data-locale-banner]');
// A blocked storage API must never interrupt the page or the puzzle.
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
if (
  banner &&
  navigator.language.toLowerCase().startsWith('ko') &&
  !read('nonogram-language') &&
  !read('nonogram-language-banner-dismissed')
)
  banner.hidden = false;
document.querySelector('[data-dismiss-locale]')?.addEventListener('click', () => {
  if (banner) banner.hidden = true;
  save('nonogram-language-banner-dismissed', '1');
});
document
  .querySelectorAll<HTMLAnchorElement>('[data-language]')
  .forEach((link) =>
    link.addEventListener('click', () => save('nonogram-language', link.dataset.language!)),
  );
