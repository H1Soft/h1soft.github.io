import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DemoBoard,
  DEMO_5,
  clues,
  puzzleClues,
  axisAfter,
  axisPath,
  moveFocus,
  cellLabel,
  type Puzzle,
} from '../src/scripts/demo-engine';
import { DEMO_10 } from '../src/scripts/demo-next';

function placements(length: number, hint: number[]) {
  const result: number[][] = [];
  for (let mask = 0; mask < 2 ** length; mask++) {
    const line = Array.from({ length }, (_, i) => (mask >> i) & 1);
    if (clues(line).join(',') === hint.join(',')) result.push(line);
  }
  return result;
}

/** Test-only independent exhaustive line enumeration, without reading answer cells. */
function lineProof(puzzle: Puzzle) {
  const hints = puzzleClues(puzzle),
    board = Array.from({ length: puzzle.h }, () => Array<number>(puzzle.w).fill(-1));
  let passes = 0;
  for (;;) {
    let changed = false;
    passes++;
    for (const row of [true, false]) {
      const groups = row ? hints.rows : hints.columns;
      for (let i = 0; i < groups.length; i++) {
        const current = row ? board[i] : board.map((r) => r[i]);
        const legal = placements(current.length, groups[i]).filter((line) =>
          line.every((v, j) => current[j] === -1 || current[j] === v),
        );
        assert.ok(legal.length);
        for (let j = 0; j < current.length; j++) {
          if (current[j] === -1 && legal.every((line) => line[j] === legal[0][j])) {
            board[row ? i : j][row ? j : i] = legal[0][j];
            changed = true;
          }
        }
      }
    }
    if (board.every((row) => row.every((v) => v !== -1))) return { board, passes };
    assert.ok(changed, 'A guessing step would be required');
  }
}

function countSolutions(puzzle: Puzzle) {
  const hints = puzzleClues(puzzle),
    rows = hints.rows.map((row) => placements(puzzle.w, row));
  const columns = hints.columns.map((col) => placements(puzzle.h, col));
  let count = 0;
  const board: number[][] = [];
  function visit(r: number) {
    if (r === puzzle.h) {
      count++;
      return;
    }
    for (const row of rows[r]) {
      board.push(row);
      if (
        columns.every((options, c) =>
          options.some((column) => board.every((line, i) => line[c] === column[i])),
        )
      )
        visit(r + 1);
      board.pop();
      if (count >= 2) return;
    }
  }
  visit(0);
  return count;
}

test('Appendix C data derives every specified clue, including visible zero clues', () => {
  assert.deepEqual(puzzleClues(DEMO_5), {
    rows: [[1], [2], [5], [2], [1]],
    columns: [[1], [1], [1], [3], [5]],
  });
  assert.deepEqual(puzzleClues(DEMO_10), {
    rows: [[4], [6], [8], [8], [6], [4], [2], [4], [1, 1], [4]],
    columns: [[0], [0], [2], [4], [6, 3], [8, 1], [8, 1], [6, 3], [4], [2]],
  });
  assert.equal(
    DEMO_5.solution.flat().reduce((a, b) => a + b, 0),
    11,
  );
  assert.equal(
    DEMO_10.solution.flat().reduce((a, b) => a + b, 0),
    48,
  );
});

test('Both supplied drawings are uniquely solved within three passes of sound line intersections', () => {
  for (const puzzle of [DEMO_5, DEMO_10]) {
    assert.equal(countSolutions(puzzle), 1);
    const proof = lineProof(puzzle);
    assert.deepEqual(proof.board, puzzle.solution);
    assert.ok(proof.passes <= 3, `${puzzle.id} required ${proof.passes} passes`);
  }
});

test('A drag applies its first-cell action and reversals do not toggle visited cells', () => {
  const board = new DemoBoard(DEMO_5);
  board.beginStroke(10, 'fill');
  [11, 12, 13, 14, 13, 12].forEach((i) => board.paint(i));
  board.endStroke();
  assert.deepEqual(board.cells.slice(10, 15), [1, 1, 1, 1, 1]);
  assert.ok(board.undo());
  assert.ok(board.cells.every((v) => v === 0));
  assert.equal(board.canUndo, false);
  board.toggle(10, 'fill');
  board.toggle(11, 'mark');
  board.beginStroke(10, 'fill');
  [11, 12].forEach((i) => board.paint(i));
  board.endStroke();
  assert.deepEqual(board.cells.slice(10, 13), [0, 0, 0]);
  board.undo();
  assert.deepEqual(board.cells.slice(10, 13), [1, -1, 0]);
});

test('Long press replaces the provisional tool and remains one undo group', () => {
  const board = new DemoBoard(DEMO_5);
  board.beginStroke(0, 'fill');
  assert.equal(board.cells[0], 1);
  board.replaceStrokeTool('mark');
  board.paint(1);
  board.endStroke();
  assert.deepEqual(board.cells.slice(0, 2), [-1, -1]);
  board.undo();
  assert.ok(board.cells.every((v) => v === 0));
  assert.equal(board.canUndo, false);
  board.toggle(0, 'fill');
  board.beginStroke(0, 'fill');
  board.replaceStrokeTool('mark');
  board.endStroke();
  assert.equal(board.cells[0], -1);
  board.undo();
  assert.equal(board.cells[0], 1);
});

test('Pointer cancellation restores the whole pending group; history is unlimited', () => {
  const board = new DemoBoard(DEMO_5);
  board.beginStroke(0, 'fill');
  board.paint(1);
  board.cancelStroke();
  assert.ok(board.cells.every((v) => v === 0));
  assert.equal(board.canUndo, false);
  for (let i = 0; i < 301; i++) board.toggle(4, 'fill');
  for (let i = 0; i < 301; i++) assert.equal(board.undo(), true);
  assert.equal(board.undo(), false);
  assert.equal(board.cells[4], 0);
});

test('Incorrect marks stay editable; completion checks exact ink and never requires X', () => {
  const board = new DemoBoard(DEMO_5);
  board.toggle(0, 'fill');
  assert.equal(board.error(0), true);
  assert.equal(board.cells[0], 1);
  board.toggle(0, 'fill');
  board.toggle(4, 'mark');
  assert.equal(board.error(4), true);
  board.clear(4);
  DEMO_5.solution.flat().forEach((v, i) => {
    if (v) board.toggle(i, 'fill');
  });
  assert.equal(board.solved, true);
  board.toggle(0, 'mark');
  assert.equal(board.solved, true);
  board.toggle(0, 'fill');
  assert.equal(board.solved, false);
});

test('Axis lock uses an 8px threshold and interpolates only the chosen row or column', () => {
  assert.equal(axisAfter(7, 0), null);
  assert.equal(axisAfter(8, 0), 'row');
  assert.equal(axisAfter(2, -9), 'column');
  assert.deepEqual(axisPath(12, 24, 5, 5, 'row'), [12, 13, 14]);
  assert.deepEqual(axisPath(12, 0, 5, 5, 'column'), [12, 7, 2]);
  assert.deepEqual(axisPath(12, 0, 5, 5, 'row'), [12, 11, 10]);
  assert.deepEqual(axisPath(12, 24, 5, 5, 'column'), [12, 17, 22]);
});

test('Keyboard focus stays on the board and live labels are bilingual without solution titles', () => {
  assert.equal(moveFocus(0, 'ArrowLeft', 5, 5), 0);
  assert.equal(moveFocus(24, 'ArrowDown', 5, 5), 24);
  assert.equal(moveFocus(7, 'ArrowUp', 5, 5), 2);
  assert.equal(moveFocus(7, 'End', 5, 5), 9);
  const board = new DemoBoard(DEMO_5);
  assert.equal(cellLabel(board, 11, 'en'), 'Row 3, column 2, empty. Row clues 5. Column clues 1.');
  assert.equal(cellLabel(board, 11, 'ko'), '3행 2열, 비어 있음. 행 힌트 5. 열 힌트 1.');
  board.toggle(0, 'fill');
  assert.match(cellLabel(board, 0, 'en'), /does not match/);
  assert.ok(!cellLabel(board, 0, 'en').includes(DEMO_5.title.en));
});
