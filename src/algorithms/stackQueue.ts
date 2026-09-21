export type SqMode = 'stack' | 'queue';
export type SqOp = 'push' | 'pop';

const BASE: SqOp[][] = [
  ['push', 'push', 'push', 'pop', 'push', 'pop'],
  ['push', 'push', 'pop', 'push', 'push', 'pop'],
  ['push', 'push', 'push', 'push', 'pop', 'pop'],
];
const LONG: SqOp[][] = [
  ['push', 'push', 'push', 'pop', 'push', 'push', 'pop', 'pop'],
  ['push', 'push', 'pop', 'push', 'push', 'push', 'pop', 'pop'],
];

/** Op scripts a tier can draw from. Express and up mixes in three-pop scripts. */
export const sqPatterns = (tier: number): SqOp[][] => (tier >= 2 ? [...BASE.slice(2), ...LONG] : BASE);

/** Which value a remove takes: the newest for a stack, the oldest for a queue. */
export const sqNext = (mode: SqMode, items: number[]): number => (mode === 'stack' ? items[items.length - 1] : items[0]);

/** The items left after that remove. */
export const sqRemove = (mode: SqMode, items: number[]): number[] => (mode === 'stack' ? items.slice(0, -1) : items.slice(1));
