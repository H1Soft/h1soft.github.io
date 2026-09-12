const gallery = document.querySelector('.gallery');
const cards = [...document.querySelectorAll('.screen-card')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const position = document.querySelector('#gallery-position');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const behavior = () => reduceMotion.matches ? 'instant' : 'smooth';
function galleryState() {
  const offset = gallery.scrollLeft;
  const max = gallery.scrollWidth - gallery.clientWidth;
  previous.disabled = offset < 2;
  next.disabled = offset >= max - 2;
  const viewport = gallery.getBoundingClientRect();
  const first = cards.findIndex(card => card.getBoundingClientRect().right > viewport.left + 60);
  position.textContent = `${String(Math.max(first, 0) + 1).padStart(2, '0')} / 05`;
}
function moveGallery(direction) {
  const step = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(gallery).gap);
  gallery.scrollBy({left: direction * step, behavior: behavior()});
}
previous.addEventListener('click', () => moveGallery(-1));
next.addEventListener('click', () => moveGallery(1));
gallery.addEventListener('keydown', event => {
  if (event.target !== gallery) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); moveGallery(event.key === 'ArrowRight' ? 1 : -1);
  }
});
let scrollFrame;
gallery.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => { galleryState(); scrollFrame = null; });
}, {passive: true});
window.addEventListener('resize', galleryState);
galleryState();

const dialog = document.querySelector('#screen-dialog');
const dialogImage = document.querySelector('#dialog-image');
const dialogTitle = document.querySelector('#dialog-title');
const close = document.querySelector('#dialog-close');
const dialogPrev = document.querySelector('#dialog-prev');
const dialogNext = document.querySelector('#dialog-next');
let active = 0;
let opener;
function showScreen(index) {
  active = Math.max(0, Math.min(cards.length - 1, index));
  const source = cards[active].querySelector('img');
  dialogImage.src = source.src;
  dialogImage.alt = source.alt;
  dialogTitle.textContent = `${String(active + 1).padStart(2, '0')} / 05 · ${cards[active].querySelector('h3').textContent}`;
  dialogPrev.disabled = active === 0;
  dialogNext.disabled = active === cards.length - 1;
}
document.querySelectorAll('.screen-open').forEach(button => {
  button.addEventListener('pointerenter', () => {
    const image = new Image(); image.src = button.querySelector('img').src;
  }, {once:true});
  button.addEventListener('click', async () => {
    opener = button;
    showScreen(Number(button.dataset.screen));
    try { await dialogImage.decode(); } catch (_) { /* The image has descriptive alt text. */ }
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
    close.focus();
  });
});
close.addEventListener('click', () => dialog.close());
dialogPrev.addEventListener('click', () => showScreen(active - 1));
dialogNext.addEventListener('click', () => showScreen(active + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showScreen(active - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showScreen(active + 1); }
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  opener?.focus({preventScroll:true});
});

// Only enhance movement; content remains visible without JavaScript.
if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('entered'); observer.unobserve(entry.target); }
  }), {threshold: .12});
  document.querySelectorAll('.product-card,.privacy-section,.faq-section').forEach(item => observer.observe(item));
}
