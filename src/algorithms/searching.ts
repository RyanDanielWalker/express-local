/* ---------- binary search ---------- */

export interface BinState {
  arr: number[];
  target: number;
  lo: number;
  hi: number;
  checks: number;
  checked: number[];
  found: number | null;
}

export const binInit = (arr: number[], target: number): BinState => ({
  arr,
  target,
  lo: 0,
  hi: arr.length - 1,
  checks: 0,
  checked: [],
  found: null,
});

export const binMid = (s: BinState): number => Math.floor((s.lo + s.hi) / 2);

export const binOver = (s: BinState): boolean =>
  s.found !== null || s.lo > s.hi;

/** Worst-case number of checks for n sorted items. */
export const binMaxChecks = (n: number): number => Math.ceil(Math.log2(n + 1));

export type BinResult = "found" | "right" | "left" | "absent";

export function binStep(
  s: BinState,
  idx: number,
): { ok: boolean; state: BinState; result?: BinResult } {
  if (binOver(s) || idx !== binMid(s)) return { ok: false, state: s };
  const v = s.arr[idx];
  const base = { ...s, checks: s.checks + 1, checked: [...s.checked, idx] };
  if (v === s.target)
    return { ok: true, state: { ...base, found: idx }, result: "found" };
  const next =
    v < s.target ? { ...base, lo: idx + 1 } : { ...base, hi: idx - 1 };
  return {
    ok: true,
    state: next,
    result: next.lo > next.hi ? "absent" : v < s.target ? "right" : "left",
  };
}

/* ---------- two pointers (pair sum on a sorted array) ---------- */

export interface TwoState {
  a: number[];
  target: number;
  lo: number;
  hi: number;
  checks: number;
  over: boolean;
}

export type TwoMove = "lo" | "hi" | "found";

export const twoInit = (a: number[], target: number): TwoState => ({
  a,
  target,
  lo: 0,
  hi: a.length - 1,
  checks: 0,
  over: false,
});

export const twoSum = (s: TwoState): number => s.a[s.lo] + s.a[s.hi];

export function twoWant(s: TwoState): TwoMove {
  const sum = twoSum(s);
  return sum < s.target ? "lo" : sum > s.target ? "hi" : "found";
}

export const hasPair = (a: number[], t: number): boolean =>
  a.some((x, p) => a.some((y, q) => q > p && x + y === t));

export function twoStep(
  s: TwoState,
  move: TwoMove,
): { ok: boolean; state: TwoState; result?: "found" | "moved" | "none" } {
  if (s.over || move !== twoWant(s)) return { ok: false, state: s };
  const checks = s.checks + 1;
  if (move === "found")
    return { ok: true, state: { ...s, checks, over: true }, result: "found" };
  const next =
    move === "lo"
      ? { ...s, checks, lo: s.lo + 1 }
      : { ...s, checks, hi: s.hi - 1 };
  if (next.lo >= next.hi)
    return { ok: true, state: { ...next, over: true }, result: "none" };
  return { ok: true, state: next, result: "moved" };
}

/* ---------- hashing ---------- */

export const hashOf = (key: number, buckets: number): number => key % buckets;

/** How many comparisons a lookup makes, and whether it found the key. */
export function lookup(
  bucket: number[],
  key: number,
): { found: boolean; comparisons: number } {
  const at = bucket.indexOf(key);
  return at > -1
    ? { found: true, comparisons: at + 1 }
    : { found: false, comparisons: bucket.length };
}
