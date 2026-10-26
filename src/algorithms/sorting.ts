/* Sorting games as small pure state machines. The UI asks what the right
 * move is, sends the player's move, and renders whatever state comes back. */

/* ---------- bubble sort ---------- */

export interface BubbleState {
  a: number[];
  pass: number;
  /** Left index of the pair being compared. */
  j: number;
  swapped: boolean;
  comps: number;
  done: boolean;
  earlyExit: boolean;
}

export const bubbleInit = (a: number[]): BubbleState => ({
  a: [...a],
  pass: 0,
  j: 0,
  swapped: false,
  comps: 0,
  done: false,
  earlyExit: false,
});

export const bubbleShouldSwap = (s: BubbleState): boolean =>
  s.a[s.j] > s.a[s.j + 1];

export interface BubbleStep {
  ok: boolean;
  state: BubbleState;
  passEnded: boolean;
}

export function bubbleStep(s: BubbleState, swap: boolean): BubbleStep {
  if (s.done || swap !== bubbleShouldSwap(s))
    return { ok: false, state: s, passEnded: false };
  const a = [...s.a];
  if (swap) [a[s.j], a[s.j + 1]] = [a[s.j + 1], a[s.j]];
  const n = a.length;
  const next: BubbleState = {
    ...s,
    a,
    comps: s.comps + 1,
    swapped: s.swapped || swap,
    j: s.j + 1,
  };
  if (next.j < n - 1 - s.pass)
    return { ok: true, state: next, passEnded: false };
  // end of a pass
  if (!next.swapped)
    return {
      ok: true,
      state: { ...next, done: true, earlyExit: true },
      passEnded: true,
    };
  const pass = s.pass + 1;
  const done = n - 1 - pass <= 0;
  return {
    ok: true,
    state: { ...next, pass, j: 0, swapped: false, done },
    passEnded: true,
  };
}

/* ---------- quicksort (Lomuto partition, pivot = last) ---------- */

export interface QuickState {
  a: number[];
  /** Ranges still waiting to be partitioned (a stack, like the call stack). */
  todo: [number, number][];
  lo: number;
  hi: number;
  /** End of the "≤ pivot" zone. */
  i: number;
  /** Value being checked. */
  j: number;
  pivot: number;
  /** Indexes in their final sorted position. */
  home: number[];
  comps: number;
  /** A partition is in progress. */
  active: boolean;
  done: boolean;
}

export function quickInit(a: number[]): QuickState {
  return quickNextRange({
    a: [...a],
    todo: [[0, a.length - 1]],
    lo: -1,
    hi: -1,
    i: -1,
    j: -1,
    pivot: 0,
    home: [],
    comps: 0,
    active: false,
    done: false,
  });
}

/** Pop the next range worth partitioning. Size-1 ranges are already home. */
export function quickNextRange(s: QuickState): QuickState {
  const todo = [...s.todo];
  const home = [...s.home];
  while (todo.length) {
    const [l, h] = todo.pop()!;
    if (h - l < 1) {
      if (l === h) home.push(l);
      continue;
    }
    return {
      ...s,
      todo,
      home,
      lo: l,
      hi: h,
      pivot: s.a[h],
      i: l - 1,
      j: l,
      active: true,
    };
  }
  return {
    ...s,
    todo,
    home: s.a.map((_, k) => k),
    lo: -1,
    hi: -1,
    j: -1,
    active: false,
    done: true,
  };
}

export const quickShouldSend = (s: QuickState): boolean => s.a[s.j] <= s.pivot;

export interface QuickStep {
  ok: boolean;
  state: QuickState;
  /** Where the pivot landed, when this move finished a partition. */
  placed: number | null;
}

export function quickStep(s: QuickState, send: boolean): QuickStep {
  if (!s.active || send !== quickShouldSend(s))
    return { ok: false, state: s, placed: null };
  const a = [...s.a];
  let i = s.i;
  if (send) {
    i++;
    [a[i], a[s.j]] = [a[s.j], a[i]];
  }
  const j = s.j + 1;
  if (j < s.hi)
    return {
      ok: true,
      state: { ...s, a, i, j, comps: s.comps + 1 },
      placed: null,
    };
  const p = i + 1;
  [a[p], a[s.hi]] = [a[s.hi], a[p]];
  const todo: [number, number][] = [...s.todo, [p + 1, s.hi], [s.lo, p - 1]]; // left side comes off first
  return {
    ok: true,
    state: {
      ...s,
      a,
      i,
      j,
      comps: s.comps + 1,
      todo,
      home: [...s.home, p],
      active: false,
    },
    placed: p,
  };
}

/* ---------- merge sort (bottom-up) ---------- */

export interface MergeState {
  /** Sorted runs at the current level. */
  runs: number[][];
  /** Merged runs built so far for the next level. */
  next: number[][];
  /** Index of the pair being merged. */
  p: number;
  left: number[] | null;
  right: number[] | null;
  i: number;
  j: number;
  out: number[];
  level: number;
  done: boolean;
}

export function mergeInit(values: number[]): MergeState {
  return mergeStart({
    runs: values.map((v) => [v]),
    next: [],
    p: 0,
    left: null,
    right: null,
    i: 0,
    j: 0,
    out: [],
    level: 1,
    done: false,
  });
}

/** Set up the next pair, rolling up to the next level (or finishing) when a level runs out. */
export function mergeStart(s: MergeState): MergeState {
  let { runs, next, p, level } = s;
  for (;;) {
    if (p * 2 + 1 < runs.length) {
      return {
        ...s,
        runs,
        next,
        p,
        level,
        left: runs[p * 2],
        right: runs[p * 2 + 1],
        i: 0,
        j: 0,
        out: [],
        done: false,
      };
    }
    if (p * 2 < runs.length) next = [...next, runs[p * 2]]; // odd one out rides along
    runs = next;
    if (runs.length <= 1)
      return {
        ...s,
        runs,
        next: [],
        p: 0,
        level,
        left: null,
        right: null,
        i: 0,
        j: 0,
        out: [],
        done: true,
      };
    next = [];
    p = 0;
    level++;
  }
}

export const mergeWant = (s: MergeState): "L" | "R" =>
  s.left![s.i] <= s.right![s.j] ? "L" : "R";

export interface MergeStep {
  ok: boolean;
  state: MergeState;
  /** Values copied over without comparing, once one side ran dry. */
  flushed: number[];
  /** This pair is fully merged; call mergeCommit next. */
  pairDone: boolean;
}

export function mergeTake(s: MergeState, side: "L" | "R"): MergeStep {
  if (!s.left || !s.right || side !== mergeWant(s))
    return { ok: false, state: s, flushed: [], pairDone: false };
  let { i, j } = s;
  const out = [...s.out, side === "L" ? s.left[i++] : s.right[j++]];
  if (i < s.left.length && j < s.right.length)
    return {
      ok: true,
      state: { ...s, i, j, out },
      flushed: [],
      pairDone: false,
    };
  const flushed = i < s.left.length ? s.left.slice(i) : s.right.slice(j);
  return {
    ok: true,
    state: {
      ...s,
      i: s.left.length,
      j: s.right.length,
      out: [...out, ...flushed],
    },
    flushed,
    pairDone: true,
  };
}

export const mergeCommit = (s: MergeState): MergeState =>
  mergeStart({ ...s, next: [...s.next, s.out], p: s.p + 1 });
