import { rnd, shuffle } from '../lib/random';

export const DIJ_POSITIONS: [number, number][] = [[60, 200], [190, 80], [190, 320], [320, 200], [450, 80], [450, 320], [560, 200]];
const ALL_EDGES: [number, number][] = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 6], [5, 6], [3, 6]];

export interface Edge {
  u: number;
  v: number;
  w: number;
}
export interface Neighbor {
  v: number;
  w: number;
  e: Edge;
}

export interface DijState {
  edges: Edge[];
  adj: Neighbor[][];
  dist: number[];
  prev: (number | null)[];
  settled: number[];
  /** Station being relaxed from. */
  cur: number | null;
  phase: 'pick' | 'relax' | 'done';
  /** Neighbors left to relax from `cur`. */
  queue: Neighbor[];
}

export function buildAdj(n: number, edges: Edge[]): Neighbor[][] {
  const adj: Neighbor[][] = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.u].push({ v: e.v, w: e.w, e });
    adj[e.v].push({ v: e.u, w: e.w, e });
  }
  adj.forEach(l => l.sort((a, b) => a.v - b.v));
  return adj;
}

function connected(adj: Neighbor[][]): boolean {
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) for (const { v } of adj[stack.pop()!]) if (!seen.has(v)) (seen.add(v), stack.push(v));
  return seen.size === adj.length;
}

export function dijFromEdges(edges: Edge[], n = DIJ_POSITIONS.length): DijState {
  return {
    edges,
    adj: buildAdj(n, edges),
    dist: Array.from({ length: n }, (_, k) => (k ? Infinity : 0)),
    prev: Array(n).fill(null),
    settled: [],
    cur: null,
    phase: 'pick',
    queue: [],
  };
}

/** A random connected weighted map. Express and up uses every track and heavier weights. */
export function dijBuild(tier = 1): DijState {
  for (;;) {
    const edges = shuffle(ALL_EDGES.slice())
      .slice(0, tier >= 2 ? 12 : 10)
      .map(([u, v]) => ({ u, v, w: rnd(1, tier >= 2 ? 12 : 9) }));
    const s = dijFromEdges(edges);
    if (connected(s.adj)) return s;
  }
}

/** Unsettled stations tied for the smallest distance. */
export function dijClosest(s: DijState): number[] {
  const open = s.dist.map((_, k) => k).filter(k => !s.settled.includes(k));
  const min = Math.min(...open.map(k => s.dist[k]));
  return open.filter(k => s.dist[k] === min);
}

export function dijPick(s: DijState, k: number): { ok: boolean; state: DijState; reason?: 'settled' | 'notClosest' } {
  if (s.phase !== 'pick') return { ok: false, state: s };
  if (s.settled.includes(k)) return { ok: false, state: s, reason: 'settled' };
  if (!dijClosest(s).includes(k)) return { ok: false, state: s, reason: 'notClosest' };
  const settled = [...s.settled, k];
  const queue = s.adj[k].filter(({ v }) => !settled.includes(v));
  const phase = settled.length === s.dist.length ? 'done' : queue.length ? 'relax' : 'pick';
  return { ok: true, state: { ...s, settled, cur: k, queue, phase } };
}

/** Would routing through `cur` make the next neighbor cheaper? */
export function dijShouldUpdate(s: DijState): boolean {
  const { v, w } = s.queue[0];
  return s.dist[s.cur!] + w < s.dist[v];
}

export function dijRelax(s: DijState, update: boolean): { ok: boolean; state: DijState } {
  if (s.phase !== 'relax' || update !== dijShouldUpdate(s)) return { ok: false, state: s };
  const { v, w } = s.queue[0];
  const dist = [...s.dist];
  const prev = [...s.prev];
  if (update) {
    dist[v] = dist[s.cur!] + w;
    prev[v] = s.cur;
  }
  const queue = s.queue.slice(1);
  return { ok: true, state: { ...s, dist, prev, queue, phase: queue.length ? 'relax' : 'pick' } };
}

/** Follow prev pointers back from `goal` to rebuild the route. */
export function dijPath(s: DijState, goal: number): number[] {
  const path: number[] = [];
  for (let x: number | null = goal; x !== null; x = s.prev[x]) path.unshift(x);
  return path;
}
