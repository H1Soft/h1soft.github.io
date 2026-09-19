import {
  DEMO_5,
  DemoBoard,
  axisAfter,
  axisPath,
  cellLabel,
  demoCopy,
  moveFocus,
  type Axis,
  type Language,
  type Tool,
} from './demo-engine';

function mountDemo(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = 'true';
  const lang: Language = root.dataset.lang === 'ko' ? 'ko' : 'en',
    t = demoCopy[lang];
  const get = <T extends HTMLElement = HTMLElement>(name: string) =>
    root.querySelector<T>(`[data-demo-${name}]`)!;
  const grid = get('grid'),
    viewport = get('viewport'),
    columns = get('columns'),
    rows = get('rows');
  const tools = [...root.querySelectorAll<HTMLButtonElement>('[data-demo-tool]')];
  const undo = get<HTMLButtonElement>('undo'),
    next = get<HTMLButtonElement>('next');
  const photo = get<HTMLImageElement>('photo'),
    live = get('live');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let board = new DemoBoard(DEMO_5),
    selected: Tool = 'fill',
    focused = 0;
  let cells = [...grid.querySelectorAll<HTMLButtonElement>('[data-cell]')];
  let started = false,
    completedFirst = false,
    locked = false,
    revealTimers: number[] = [];
  let announcement = 0,
    longPress = 0,
    revealAt = 0,
    advanceRequest = 0;
  let satisfied = new Set<string>();
  type Gesture = {
    pointer: number;
    x: number;
    y: number;
    first: number;
    last: number;
    axis: Axis | null;
    tool: Tool;
  };
  let gesture: Gesture | null = null;

  function track(name: 'demo_start' | 'demo_complete' | 'demo_advance_10' | 'demo_reset') {
    document.dispatchEvent(
      new CustomEvent('nonogram:event', {
        detail: {
          name,
          puzzle: board.puzzle.id,
          size: `${board.puzzle.w}x${board.puzzle.h}`,
          lang,
        },
      }),
    );
  }
  function say(text: string) {
    window.clearTimeout(announcement);
    live.textContent = '';
    announcement = window.setTimeout(() => {
      live.textContent = text;
    }, 30);
  }
  function highlight(index: number, axis: Axis | null = null) {
    const r = Math.floor(index / board.puzzle.w),
      c = index % board.puzzle.w;
    for (const element of columns.children)
      (element as HTMLElement).classList.toggle(
        'is-active',
        Number((element as HTMLElement).dataset.clueColumn) === c,
      );
    for (const element of rows.children)
      (element as HTMLElement).classList.toggle(
        'is-active',
        Number((element as HTMLElement).dataset.clueRow) === r,
      );
    cells.forEach((cell, i) => {
      cell.classList.toggle(
        'is-traced',
        axis === 'row'
          ? Math.floor(i / board.puzzle.w) === r
          : axis === 'column' && i % board.puzzle.w === c,
      );
    });
  }
  function focusCell(index: number, move = true) {
    cells[focused]?.setAttribute('tabindex', '-1');
    focused = index;
    cells[focused].tabIndex = locked ? -1 : 0;
    if (move) {
      cells[focused].focus({ preventScroll: true });
      const a = cells[focused].getBoundingClientRect(),
        v = viewport.getBoundingClientRect();
      if (a.left < v.left) viewport.scrollLeft -= v.left - a.left + 6;
      else if (a.right > v.right) viewport.scrollLeft += a.right - v.right + 6;
    }
    highlight(index);
  }
  function render(index?: number, announce = false) {
    cells.forEach((cell, i) => {
      const state = board.cells[i];
      cell.dataset.state = state === 1 ? 'filled' : state === -1 ? 'marked' : 'empty';
      cell.classList.toggle('is-error', board.error(i));
      cell.setAttribute('aria-label', cellLabel(board, i, lang));
      cell.firstElementChild!.textContent = state === -1 ? '✕' : '';
      cell.style.setProperty(
        '--reveal-ink',
        Math.floor(i / board.puzzle.w) < board.puzzle.h * 0.4
          ? '#2E4A6B'
          : Math.floor(i / board.puzzle.w) < board.puzzle.h * 0.7
            ? '#D98E4B'
            : '#F2EDE2',
      );
    });
    const now = new Set<string>(),
      newly: string[] = [];
    for (const axis of ['row', 'column'] as Axis[]) {
      const elements = axis === 'row' ? rows.children : columns.children;
      [...elements].forEach((element, i) => {
        const done = board.lineSatisfied(axis, i),
          key = `${axis}-${i}`;
        element.classList.toggle('is-satisfied', done);
        if (done) {
          now.add(key);
          if (!satisfied.has(key)) newly.push(t.line(axis, i + 1));
        }
      });
    }
    satisfied = now;
    undo.disabled = locked || !board.canUndo;
    if (index !== undefined && announce) {
      const value = board.cells[index];
      const state = value === 1 ? t.filled : value === -1 ? t.marked : t.empty;
      say(
        `${t.cell(Math.floor(index / board.puzzle.w) + 1, (index % board.puzzle.w) + 1)} ${state}.${board.error(index) ? ` ${t.error}.` : ''} ${newly.join(' ')}`,
      );
    }
  }
  function markStarted() {
    if (!started && board.cells.includes(1)) {
      started = true;
      if (board.puzzle.w === 5) track('demo_start');
    }
  }
  function clearGesture(cancel = false) {
    window.clearTimeout(longPress);
    if (!gesture) return;
    if (cancel) board.cancelStroke();
    else board.endStroke();
    const pointer = gesture.pointer;
    gesture = null;
    if (grid.hasPointerCapture(pointer)) grid.releasePointerCapture(pointer);
    delete root.dataset.temporaryTool;
    get('axis').textContent = '';
    focusCell(focused);
    render();
    if (!cancel) {
      markStarted();
      if (board.solved) reveal();
    }
  }
  function coordinate(x: number, y: number) {
    const rect = grid.getBoundingClientRect(),
      { w, h } = board.puzzle;
    const c = Math.max(0, Math.min(w - 1, Math.floor((x - rect.left) / (rect.width / w))));
    const r = Math.max(0, Math.min(h - 1, Math.floor((y - rect.top) / (rect.height / h))));
    return r * w + c;
  }

  grid.addEventListener('pointerdown', (event) => {
    if (locked || gesture || event.button !== 0 || !event.isPrimary) return;
    const cell = (event.target as Element).closest<HTMLButtonElement>('[data-cell]');
    if (!cell) return;
    event.preventDefault();
    const index = Number(cell.dataset.cell);
    focusCell(index);
    gesture = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      first: index,
      last: index,
      axis: null,
      tool: selected,
    };
    grid.setPointerCapture(event.pointerId);
    board.beginStroke(index, selected);
    render(index, true);
    longPress = window.setTimeout(() => {
      if (!gesture || gesture.axis) return;
      const reversed = gesture.tool === 'fill' ? 'mark' : 'fill';
      board.replaceStrokeTool(reversed);
      root.dataset.temporaryTool = reversed;
      render(index, true);
    }, 250);
  });
  grid.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.pointer !== event.pointerId || locked) return;
    event.preventDefault();
    if (!gesture.axis) {
      gesture.axis = axisAfter(event.clientX - gesture.x, event.clientY - gesture.y);
      if (!gesture.axis) return;
      window.clearTimeout(longPress);
    }
    const path = axisPath(
      gesture.last,
      coordinate(event.clientX, event.clientY),
      board.puzzle.w,
      board.puzzle.h,
      gesture.axis,
    );
    path.forEach((index) => board.paint(index));
    gesture.last = path[path.length - 1];
    focused = gesture.last;
    cells.forEach((cell, i) => {
      cell.tabIndex = i === focused ? 0 : -1;
    });
    highlight(focused, gesture.axis);
    get('axis').textContent = t.locked(
      gesture.axis,
      gesture.axis === 'row'
        ? Math.floor(focused / board.puzzle.w) + 1
        : (focused % board.puzzle.w) + 1,
    );
    render(focused, true);
  });
  grid.addEventListener('pointerup', (event) => {
    if (gesture?.pointer === event.pointerId) clearGesture();
  });
  grid.addEventListener('pointercancel', (event) => {
    if (gesture?.pointer === event.pointerId) clearGesture(true);
  });
  grid.addEventListener('lostpointercapture', () => {
    if (gesture) clearGesture(true);
  });
  grid.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('blur', () => clearGesture(true));
  grid.addEventListener('focusin', (event) => {
    const cell = (event.target as Element).closest<HTMLButtonElement>('[data-cell]');
    if (cell && !gesture) focusCell(Number(cell.dataset.cell), false);
  });
  // Assistive technologies can activate a cell with a click without pointer events.
  grid.addEventListener('click', (event) => {
    if (event.detail !== 0 || locked || gesture) return;
    const cell = (event.target as Element).closest<HTMLButtonElement>('[data-cell]');
    if (!cell) return;
    focusCell(Number(cell.dataset.cell), false);
    board.toggle(focused, selected);
    render(focused, true);
    markStarted();
    if (board.solved) reveal();
  });
  grid.addEventListener('keydown', (event) => {
    if (locked || event.altKey || event.metaKey || event.ctrlKey) return;
    const key = event.key.toLowerCase();
    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      clearGesture();
      if (locked) return;
      focusCell(moveFocus(focused, event.key, board.puzzle.w, board.puzzle.h));
      return;
    }
    if (![' ', 'x', 'backspace', 'u'].includes(key)) return;
    event.preventDefault();
    clearGesture();
    if (locked) return;
    if (key === 'u') {
      performUndo();
      return;
    }
    if (key === 'backspace') board.clear(focused);
    else board.toggle(focused, key === 'x' ? 'mark' : 'fill');
    render(focused, true);
    markStarted();
    if (board.solved) reveal();
  });
  function performUndo() {
    if (locked) return;
    clearGesture();
    if (locked) return;
    const changed = board.undo();
    render();
    say(changed ? t.undoDone : t.nothing);
  }
  tools.forEach((button) => {
    button.disabled = false;
    button.addEventListener('click', () => {
      selected = button.dataset.demoTool as Tool;
      tools.forEach((b) => {
        b.classList.toggle('is-selected', b === button);
        b.setAttribute('aria-pressed', String(b === button));
      });
    });
  });
  undo.addEventListener('click', performUndo);
  get('pan-left').addEventListener('click', () =>
    viewport.scrollBy({ left: -160, behavior: reduced.matches ? 'auto' : 'smooth' }),
  );
  get('pan-right').addEventListener('click', () =>
    viewport.scrollBy({ left: 160, behavior: reduced.matches ? 'auto' : 'smooth' }),
  );
  const updatePan = () => {
    get('pan').hidden = locked || viewport.scrollWidth <= viewport.clientWidth + 2;
  };
  new ResizeObserver(updatePan).observe(viewport);

  function stopRevealTimers() {
    revealTimers.forEach(window.clearTimeout);
    revealTimers = [];
  }
  function finishReveal() {
    if (!locked) return;
    stopRevealTimers();
    root.dataset.phase = 'complete';
    viewport.scrollLeft = 0;
    get('skip').hidden = true;
    get('result').hidden = false;
    get('result-title').focus({ preventScroll: true });
    grid.setAttribute('aria-hidden', 'true');
  }
  function reveal() {
    if (locked) return;
    locked = true;
    revealAt = performance.now();
    completedFirst ||= board.puzzle.w === 5;
    root.style.setProperty(
      '--result-width',
      `${Math.min(viewport.clientWidth, get('assembly').getBoundingClientRect().width)}px`,
    );
    track('demo_complete');
    root.dataset.phase = 'merging';
    root.dataset.photoReady = 'false';
    grid.setAttribute('aria-disabled', 'true');
    cells.forEach((cell) => {
      cell.tabIndex = -1;
    });
    tools.forEach((button) => {
      button.disabled = true;
    });
    undo.disabled = true;
    get('tools').hidden = true;
    get('guide').hidden = true;
    get('pan').hidden = true;
    get('instruction').hidden = true;
    get('skip').hidden = false;
    get('result-title').textContent = board.puzzle.title[lang];
    get('caption').textContent = board.puzzle.caption[lang];
    get('earned').textContent = board.puzzle.w === 5 ? t.earned : t.earnedNext;
    get('city').textContent = board.puzzle.city;
    next.hidden = board.puzzle.w !== 5;
    photo.onload = () => {
      root.dataset.photoReady = 'true';
    };
    photo.onerror = () => {
      root.dataset.photoReady = 'false';
    };
    photo.src = `/nonogram/images/city-${board.puzzle.city.toLowerCase()}.avif`;
    say(t.result);
    if (reduced.matches) {
      root.dataset.phase = 'reduced';
      revealTimers.push(window.setTimeout(finishReveal, 250));
    } else {
      for (const [delay, phase] of [
        [300, 'coloring'],
        [800, 'expanding'],
        [1100, 'stamping'],
      ] as const) {
        revealTimers.push(
          window.setTimeout(() => {
            root.dataset.phase = phase;
          }, delay),
        );
      }
      revealTimers.push(window.setTimeout(finishReveal, 1400));
    }
  }
  get('skip').addEventListener('click', finishReveal);
  get('window').addEventListener('click', () => {
    if (locked && root.dataset.phase !== 'complete' && performance.now() - revealAt > 100)
      finishReveal();
  });

  function rebuild() {
    const { w, h } = board.puzzle;
    stopRevealTimers();
    locked = false;
    started = false;
    focused = 0;
    satisfied.clear();
    root.dataset.phase = 'playing';
    root.dataset.size = String(w);
    delete root.dataset.photoReady;
    root.style.setProperty('--n', String(w));
    grid.removeAttribute('aria-disabled');
    grid.removeAttribute('aria-hidden');
    grid.setAttribute('aria-rowcount', String(h));
    grid.setAttribute('aria-colcount', String(w));
    grid.replaceChildren();
    rows.replaceChildren();
    columns.replaceChildren();
    for (const axis of ['row', 'column'] as Axis[]) {
      (axis === 'row' ? board.hints.rows : board.hints.columns).forEach((numbers, i) => {
        const node = document.createElement('div');
        node.className = `demo-clue demo-${axis}-clue`;
        node.setAttribute(`data-clue-${axis}`, String(i));
        numbers.forEach((n) => {
          const span = document.createElement('span');
          span.textContent = String(n);
          node.append(span);
        });
        (axis === 'row' ? rows : columns).append(node);
      });
    }
    for (let r = 0; r < h; r++) {
      const row = document.createElement('div');
      row.className = 'demo-grid-row';
      row.setAttribute('role', 'row');
      row.setAttribute('aria-rowindex', String(r + 1));
      for (let c = 0; c < w; c++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'demo-cell';
        cell.dataset.cell = String(r * w + c);
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-colindex', String(c + 1));
        cell.tabIndex = r === 0 && c === 0 ? 0 : -1;
        const content = document.createElement('span');
        content.setAttribute('aria-hidden', 'true');
        cell.append(content);
        row.append(cell);
      }
      grid.append(row);
    }
    cells = [...grid.querySelectorAll<HTMLButtonElement>('[data-cell]')];
    get('meta').textContent = `DEMO · ${w} × ${h} · ${w === 5 ? 'ECONOMY' : 'ECONOMY+'}`;
    get('seat').textContent = w === 5 ? 'SEAT 1A' : 'SEAT 12A';
    get('instruction').textContent = w === 5 ? t.instruction : t.nextInstruction;
    for (const name of ['tools', 'guide', 'instruction']) get(name).hidden = false;
    for (const name of ['result', 'skip']) get(name).hidden = true;
    tools.forEach((button) => {
      button.disabled = false;
    });
    viewport.scrollLeft = 0;
    photo.removeAttribute('src');
    render();
    updatePan();
    focusCell(0);
    say(get('instruction').textContent!);
  }
  get('replay').addEventListener('click', () => {
    advanceRequest++;
    next.disabled = false;
    track('demo_reset');
    board = new DemoBoard(board.puzzle);
    rebuild();
  });
  next.addEventListener('click', async () => {
    if (!completedFirst || board.puzzle.w !== 5) return;
    const request = ++advanceRequest;
    next.disabled = true;
    say(t.loading);
    try {
      const module = await import('./demo-next');
      if (request !== advanceRequest) return;
      board = module.createNextBoard();
      track('demo_advance_10');
      rebuild();
    } catch {
      if (request === advanceRequest) say(t.retry);
    } finally {
      if (request === advanceRequest) next.disabled = false;
    }
  });
  cells.forEach((cell) => cell.removeAttribute('aria-disabled'));
  render();
  updatePan();
}

document.querySelectorAll<HTMLElement>('[data-nonogram-demo]').forEach(mountDemo);
