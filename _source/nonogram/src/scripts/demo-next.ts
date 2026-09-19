import { DemoBoard, type Puzzle } from './demo-engine';

/** Appendix C-2. This module is requested only after a completed first puzzle. */
export const DEMO_10: Puzzle = {
  id: 'demo-b',
  w: 10,
  h: 10,
  city: 'HKG',
  title: { en: 'Hot air balloon', ko: '열기구' },
  caption: { en: 'HONG KONG · HKG · SEAT 12A', ko: '홍콩 · HKG · 좌석 12A' },
  solution: [
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
  ],
};
export function createNextBoard() {
  return new DemoBoard(DEMO_10);
}
