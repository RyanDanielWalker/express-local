import { shuffle } from "../lib/random";

export type RecFn = "fact" | "fib";

export interface RecEvent {
  t: "call" | "ret";
  label: string;
  n: number;
  depth: number;
  /** Return value (ret only). */
  v?: number;
  /** How the value was computed, e.g. "3 × 2" (ret only). */
  how?: string;
}

export const REC_CODE: Record<RecFn, string> = {
  fact: `function fact(n) {
  if (n <= 1) return 1;   // base case
  return n * fact(n - 1);
}`,
  fib: `function fib(n) {
  if (n <= 1) return n;   // base case
  return fib(n - 1) + fib(n - 2);
}`,
};

export const recValue = (fn: RecFn, n: number): number =>
  fn === "fact"
    ? n <= 1
      ? 1
      : n * recValue(fn, n - 1)
    : n <= 1
      ? n
      : recValue(fn, n - 1) + recValue(fn, n - 2);

/** Every call and return, in the exact order the computer does them. */
export function traceCalls(fn: RecFn, n0: number): RecEvent[] {
  const out: RecEvent[] = [];
  (function run(n: number, depth: number): number {
    const label = `${fn}(${n})`;
    out.push({ t: "call", label, n, depth });
    let v: number;
    let how: string;
    if (n <= 1) {
      v = fn === "fact" ? 1 : n;
      how = "base case";
    } else if (fn === "fact") {
      const c = run(n - 1, depth + 1);
      v = n * c;
      how = `${n} × ${c}`;
    } else {
      const a = run(n - 1, depth + 1);
      const b = run(n - 2, depth + 1);
      v = a + b;
      how = `${a} + ${b}`;
    }
    out.push({ t: "ret", label, n, v, how, depth });
    return v;
  })(n0, 0);
  return out;
}

export const eventText = (e: RecEvent): string =>
  e.t === "call" ? `call ${e.label}` : `return ${e.v}`;

/** The right answer plus two plausible wrong ones, shuffled. */
export function recOptions(fn: RecFn, frameN: number, want: string): string[] {
  const pool = [
    `return ${recValue(fn, frameN)}`,
    `return ${frameN}`,
    "return 1",
    "return 0",
    `call ${fn}(${frameN - 1})`,
    `call ${fn}(${frameN})`,
  ];
  if (frameN - 2 >= 0) pool.push(`call ${fn}(${frameN - 2})`);
  const wrong = shuffle(
    [...new Set(pool)].filter((x) => x !== want && !x.includes("(-")),
  ).slice(0, 2);
  return shuffle([want, ...wrong]);
}
