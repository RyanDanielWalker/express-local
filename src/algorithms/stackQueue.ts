export type SqMode = "stack" | "queue";
export type SqOp = "push" | "pop";

const BASE: SqOp[][] = [
  ["push", "push", "push", "pop", "push", "pop"],
  ["push", "push", "pop", "push", "push", "pop"],
  ["push", "push", "push", "push", "pop", "pop"],
];
const LONG: SqOp[][] = [
  ["push", "push", "push", "pop", "push", "push", "pop", "pop"],
  ["push", "push", "pop", "push", "push", "push", "pop", "pop"],
];

/** Op scripts a tier can draw from. Express and up mixes in three-pop scripts. */
export const sqPatterns = (tier: number): SqOp[][] =>
  tier >= 2 ? [...BASE.slice(2), ...LONG] : BASE;

/** Which value a remove takes: the newest for a stack, the oldest for a queue. */
export const sqNext = (mode: SqMode, items: number[]): number =>
  mode === "stack" ? items[items.length - 1] : items[0];

/** The items left after that remove. */
export const sqRemove = (mode: SqMode, items: number[]): number[] =>
  mode === "stack" ? items.slice(0, -1) : items.slice(1);

/** Give each script its own values, in order, one per push. No value is used twice. */
export function splitPools(scripts: SqOp[][], vals: number[]): number[][] {
  let used = 0;
  return scripts.map((s) => {
    const n = s.filter((x) => x === "push").length;
    used += n;
    return vals.slice(used - n, used);
  });
}
