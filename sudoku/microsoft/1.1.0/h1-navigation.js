// Microsoft Sudoku ONLY. Browser/keyboard Back uses the active internal handler.
(() => {
  'use strict';
  const handlers = new Map();
  let nextId = 0, busy = false, ready = false;
  async function back() {
    if (busy) return;
    const handler = [...handlers.values()].at(-1);
    if (!handler) return;
    busy = true;
    try { await handler(); }
    catch (_) { console.warn('Internal back navigation failed'); }
    finally { busy = false; }
  }
  window.h1Navigation = Object.freeze({
    register(handler) {
      if (typeof handler !== 'function') throw new TypeError('Back callback required');
      const id = ++nextId; handlers.set(id, handler); return id;
    },
    remove(id) { handlers.delete(id); },
    loaded() { ready = true; },
  });
  window.addEventListener('keydown', event => {
    if (!ready || !handlers.size || event.repeat) return;
    if (event.key === 'Escape' || (event.altKey && event.key === 'ArrowLeft')) {
      event.preventDefault(); event.stopImmediatePropagation(); void back();
    }
  }, { capture: true });
})();
