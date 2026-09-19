export type Language = 'en' | 'ko';
export type Cell = -1 | 0 | 1;
export type Tool = 'fill' | 'mark';
export type Axis = 'row' | 'column';
export type Puzzle = {
  id: 'demo-a' | 'demo-b';
  w: number;
  h: number;
  solution: readonly (readonly number[])[];
  title: Record<Language, string>;
  caption: Record<Language, string>;
  city: 'ICN' | 'HKG';
};

/** Appendix C-1. The second puzzle deliberately lives in its own lazy module. */
export const DEMO_5: Puzzle = {
  id: 'demo-a',
  w: 5,
  h: 5,
  solution: [
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1],
    [0, 0, 0, 0, 1],
  ],
  title: { en: 'Paper plane', ko: '종이비행기' },
  caption: { en: 'SEOUL · ICN · SEAT 1A', ko: '서울 · ICN · 좌석 1A' },
  city: 'ICN',
};

export function clues(line: readonly number[]): number[] {
  const result: number[] = [];
  let run = 0;
  for (const value of [...line, 0]) {
    if (value === 1) run++;
    else if (run) {
      result.push(run);
      run = 0;
    }
  }
  return result.length ? result : [0];
}

export function puzzleClues(puzzle: Puzzle) {
  return {
    rows: puzzle.solution.map(clues),
    columns: Array.from({ length: puzzle.w }, (_, c) =>
      clues(puzzle.solution.map((row) => row[c])),
    ),
  };
}

export function axisAfter(dx: number, dy: number): Axis | null {
  if (Math.hypot(dx, dy) < 8) return null;
  return Math.abs(dx) >= Math.abs(dy) ? 'row' : 'column';
}

/** Includes every crossed cell, even when pointer events skip several cells. */
export function axisPath(
  from: number,
  to: number,
  width: number,
  height: number,
  axis: Axis,
): number[] {
  const row = Math.floor(from / width),
    col = from % width;
  const target =
    axis === 'row'
      ? Math.max(0, Math.min(width - 1, to % width))
      : Math.max(0, Math.min(height - 1, Math.floor(to / width)));
  const start = axis === 'row' ? col : row,
    step = target >= start ? 1 : -1;
  const result: number[] = [];
  for (let value = start; ; value += step) {
    result.push(axis === 'row' ? row * width + value : value * width + col);
    if (value === target) return result;
  }
}

export function moveFocus(index: number, key: string, width: number, height: number): number {
  const r = Math.floor(index / width),
    c = index % width;
  if (key === 'ArrowLeft') return r * width + Math.max(0, c - 1);
  if (key === 'ArrowRight') return r * width + Math.min(width - 1, c + 1);
  if (key === 'ArrowUp') return Math.max(0, r - 1) * width + c;
  if (key === 'ArrowDown') return Math.min(height - 1, r + 1) * width + c;
  if (key === 'Home') return r * width;
  if (key === 'End') return r * width + width - 1;
  return index;
}

type Change = { index: number; before: Cell; after: Cell };
export class DemoBoard {
  readonly cells: Cell[];
  readonly hints: ReturnType<typeof puzzleClues>;
  private history: Change[][] = [];
  private pending: Map<number, Change> | null = null;
  private strokeStart = 0;
  private strokeValue: Cell = 0;
  constructor(readonly puzzle: Puzzle) {
    if (
      puzzle.solution.length !== puzzle.h ||
      puzzle.solution.some((row) => row.length !== puzzle.w || row.some((v) => v !== 0 && v !== 1))
    ) {
      throw new Error('Invalid demo puzzle');
    }
    this.cells = Array<Cell>(puzzle.w * puzzle.h).fill(0);
    this.hints = puzzleClues(puzzle);
  }
  get canUndo() {
    return this.history.length > 0 || !!this.pending?.size;
  }
  get solved() {
    return this.cells.every(
      (v, i) =>
        (v === 1) ===
        (this.puzzle.solution[Math.floor(i / this.puzzle.w)][i % this.puzzle.w] === 1),
    );
  }
  error(index: number) {
    const v = this.cells[index],
      answer = this.puzzle.solution[Math.floor(index / this.puzzle.w)][index % this.puzzle.w];
    return (v === 1 && answer === 0) || (v === -1 && answer === 1);
  }
  private valid(index: number) {
    return Number.isInteger(index) && index >= 0 && index < this.cells.length;
  }
  beginStroke(index: number, tool: Tool) {
    if (!this.valid(index)) return;
    this.endStroke();
    this.pending = new Map();
    this.strokeStart = index;
    const wanted = tool === 'fill' ? 1 : -1;
    this.strokeValue = this.cells[index] === wanted ? 0 : wanted;
    this.paint(index);
  }
  /** Long press replaces the provisional first action, without an extra undo group. */
  replaceStrokeTool(tool: Tool) {
    if (!this.pending) return;
    const start = this.strokeStart;
    this.cancelStroke();
    this.beginStroke(start, tool);
  }
  paint(index: number) {
    if (!this.pending || !this.valid(index) || this.cells[index] === this.strokeValue) return;
    const change = this.pending.get(index) ?? {
      index,
      before: this.cells[index],
      after: this.strokeValue,
    };
    change.after = this.strokeValue;
    this.pending.set(index, change);
    this.cells[index] = this.strokeValue;
  }
  endStroke() {
    if (!this.pending) return;
    const changes = [...this.pending.values()].filter((v) => v.before !== v.after);
    if (changes.length) this.history.push(changes);
    this.pending = null;
  }
  cancelStroke() {
    this.pending?.forEach((change) => {
      this.cells[change.index] = change.before;
    });
    this.pending = null;
  }
  toggle(index: number, tool: Tool) {
    this.beginStroke(index, tool);
    this.endStroke();
  }
  clear(index: number) {
    this.endStroke();
    if (!this.valid(index) || !this.cells[index]) return;
    this.history.push([{ index, before: this.cells[index], after: 0 }]);
    this.cells[index] = 0;
  }
  undo() {
    this.endStroke();
    const changes = this.history.pop();
    changes?.forEach((change) => {
      this.cells[change.index] = change.before;
    });
    return !!changes;
  }
  lineSatisfied(axis: Axis, index: number) {
    const line =
      axis === 'row'
        ? this.cells.slice(index * this.puzzle.w, (index + 1) * this.puzzle.w)
        : Array.from({ length: this.puzzle.h }, (_, r) => this.cells[r * this.puzzle.w + index]);
    const expected = axis === 'row' ? this.hints.rows[index] : this.hints.columns[index];
    if (expected[0] === 0) return line.every((v) => v === -1);
    return clues(line).join(',') === expected.join(',');
  }
}

export const demoCopy = {
  en: {
    heading: 'Try one before you fly.',
    grid: 'Playable nonogram',
    rows: 'Row clues',
    columns: 'Column clues',
    fill: 'Fill',
    mark: 'Mark',
    undo: 'Undo',
    undoDone: 'Last move undone.',
    nothing: 'No moves to undo.',
    instruction: 'Start with a 5. Fill every square in that line.',
    controls: 'Tap to fill. Tap again to erase. Hold to switch tools.',
    keyboard: 'Keyboard controls',
    keys: 'Arrow keys move. Space fills, X marks, Backspace erases, U undoes.',
    rule: 'Numbers tell you how many squares to fill in a row. Leave a gap between groups.',
    nojs: 'Enable JavaScript to play this puzzle. The clues are ready to read.',
    skip: 'Skip animation',
    earned: 'Your first view, developed.',
    earnedNext: 'Another view for your journey.',
    result: 'Puzzle complete. You collected a photo.',
    next: 'Try a 10 × 10',
    replay: 'Play again',
    coming: 'Coming to Android and iOS',
    explore: 'Explore the app',
    more: '12 cities. 192 flights. A whole album of discoveries.',
    loading: 'Preparing your next flight…',
    retry: 'Could not open the next puzzle. Please try again.',
    nextInstruction: 'A 0 means the whole line stays empty. Mark it with X.',
    pan: 'Slide the clues to see every column.',
    left: 'Show columns to the left',
    right: 'Show columns to the right',
    empty: 'empty',
    filled: 'filled',
    marked: 'marked X',
    error: 'does not match the clue solution',
    cell: (r: number, c: number) => `Row ${r}, column ${c}`,
    clue: (row: string, col: string) => `Row clues ${row}. Column clues ${col}.`,
    line: (axis: Axis, n: number) => `${axis === 'row' ? 'Row' : 'Column'} ${n} complete.`,
    locked: (axis: Axis, n: number) => `${axis === 'row' ? 'ROW' : 'COLUMN'} ${n} · AXIS LOCK`,
  },
  ko: {
    heading: '떠나기 전, 한 판 먼저.',
    grid: '직접 푸는 네모로직',
    rows: '행 힌트',
    columns: '열 힌트',
    fill: '칠하기',
    mark: 'X 표시',
    undo: '되돌리기',
    undoDone: '마지막 동작을 되돌렸습니다.',
    nothing: '되돌릴 동작이 없습니다.',
    instruction: '숫자 5부터 시작하세요. 그 줄을 모두 칠합니다.',
    controls: '탭해서 칠하고, 다시 탭해서 지워요. 길게 누르면 도구가 바뀌어요.',
    keyboard: '키보드 조작',
    keys: '방향키로 이동 · Space 칠하기 · X 표시 · Backspace 지우기 · U 되돌리기',
    rule: '숫자는 연속해서 칠할 칸 수예요. 숫자 묶음 사이에는 빈칸을 남겨요.',
    nojs: '이 퍼즐을 풀려면 자바스크립트를 켜 주세요. 힌트는 그대로 읽을 수 있어요.',
    skip: '연출 건너뛰기',
    earned: '첫 번째 풍경이 현상됐어요.',
    earnedNext: '여정에 새로운 풍경을 더했어요.',
    result: '퍼즐 완성. 사진을 얻었습니다.',
    next: '10 × 10도 해보기',
    replay: '다시 하기',
    coming: 'Android와 iOS로 곧 만나요',
    explore: '앱 살펴보기',
    more: '12개 도시, 192편의 비행. 풍경으로 채우는 나만의 앨범.',
    loading: '다음 비행을 준비하고 있어요…',
    retry: '다음 퍼즐을 열지 못했어요. 다시 시도해 주세요.',
    nextInstruction: '0은 그 줄이 모두 빈칸이라는 뜻이에요. X로 표시해 보세요.',
    pan: '힌트 숫자를 밀면 다음 열을 볼 수 있어요.',
    left: '왼쪽 열 보기',
    right: '오른쪽 열 보기',
    empty: '비어 있음',
    filled: '칠함',
    marked: 'X 표시',
    error: '정답과 다른 표시',
    cell: (r: number, c: number) => `${r}행 ${c}열`,
    clue: (row: string, col: string) => `행 힌트 ${row}. 열 힌트 ${col}.`,
    line: (axis: Axis, n: number) => `${n}${axis === 'row' ? '행' : '열'} 완성.`,
    locked: (axis: Axis, n: number) => `${n}${axis === 'row' ? '행' : '열'} · 축 잠금`,
  },
};

export function cellLabel(board: DemoBoard, index: number, lang: Language): string {
  const t = demoCopy[lang],
    r = Math.floor(index / board.puzzle.w),
    c = index % board.puzzle.w;
  const state =
    board.cells[index] === 1 ? t.filled : board.cells[index] === -1 ? t.marked : t.empty;
  return `${t.cell(r + 1, c + 1)}, ${state}. ${t.clue(board.hints.rows[r].join(' '), board.hints.columns[c].join(' '))}${board.error(index) ? ` ${t.error}.` : ''}`;
}
