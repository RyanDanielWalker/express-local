import { rnd } from '../lib/random';

export interface GraphNode {
  x: number;
  y: number;
  layer: number;
}
export interface Graph {
  nodes: GraphNode[];
  /** Neighbor lists, sorted ascending (alphabetical by label). */
  adj: number[][];
}

/**
 * A layered "station map": node 0 on top, each lower node hangs off a random
 * node in the layer above, plus a few extra cross-links so it's a graph and
 * not just a tree. Labels follow reading order.
 */
export function makeGraph(tier = 1): Graph {
  const sizes = tier >= 2 ? [1, 3, 4, rnd(2, 3)] : [1, rnd(2, 3), rnd(3, 4), rnd(1, 2)];
  const nodes: GraphNode[] = [];
  const layers: number[][] = [];
  sizes.forEach((n, layer) => {
    const row: number[] = [];
    for (let i = 0; i < n; i++) {
      row.push(nodes.length);
      nodes.push({
        x: Math.round(((i + 1) / (n + 1)) * 600 + (layer ? rnd(-18, 18) : 0)),
        y: 50 + layer * 94,
        layer,
      });
    }
    layers.push(row);
  });
  const adj = nodes.map(() => new Set<number>());
  const link = (a: number, b: number) => {
    adj[a].add(b);
    adj[b].add(a);
  };
  layers.forEach((row, layer) => {
    if (layer) row.forEach(n => link(n, layers[layer - 1][rnd(0, layers[layer - 1].length - 1)]));
  });
  const wanted = tier >= 2 ? 3 : 2;
  for (let extra = 0, tries = 0; extra < wanted && tries < 40; tries++) {
    const u = rnd(1, nodes.length - 1);
    const { layer } = nodes[u];
    const row = layers[layer];
    const pos = row.indexOf(u);
    let v: number | undefined;
    if (Math.random() < 0.5 && pos + 1 < row.length) v = row[pos + 1];
    else if (layer + 1 < layers.length) v = layers[layer + 1][rnd(0, layers[layer + 1].length - 1)];
    if (v === undefined || adj[u].has(v)) continue;
    link(u, v);
    extra++;
  }
  return { nodes, adj: adj.map(s => [...s].sort((a, b) => a - b)) };
}

export interface StackEntry {
  n: number;
  /** Already visited by the time this snapshot was taken, so it'll be skipped. */
  skip?: boolean;
}

export interface Traversal {
  order: number[];
  /** Queue/stack contents right after visiting order[i]. */
  snaps: StackEntry[][];
  /** Which node discovered each node (the tree edge). */
  parent: Record<number, number | null>;
}

/**
 * BFS: queue, mark seen when enqueued.
 * DFS: stack, mark seen when popped, push neighbors in reverse so the
 * alphabetically first one comes off first. Same visit order as recursive DFS.
 */
export function traverse(adj: number[][], kind: 'bfs' | 'dfs', start = 0): Traversal {
  const order: number[] = [];
  const snaps: StackEntry[][] = [];
  const parent: Record<number, number | null> = {};
  if (kind === 'bfs') {
    const seen = new Set([start]);
    const queue = [start];
    parent[start] = null;
    while (queue.length) {
      const n = queue.shift()!;
      order.push(n);
      for (const m of adj[n]) {
        if (!seen.has(m)) {
          seen.add(m);
          parent[m] = n;
          queue.push(m);
        }
      }
      snaps.push(queue.map(n => ({ n })));
    }
  } else {
    const seen = new Set<number>();
    const stack: { n: number; from: number | null }[] = [{ n: start, from: null }];
    while (stack.length) {
      const e = stack.pop()!;
      if (seen.has(e.n)) continue;
      seen.add(e.n);
      parent[e.n] = e.from;
      order.push(e.n);
      for (const m of [...adj[e.n]].reverse()) if (!seen.has(m)) stack.push({ n: m, from: e.n });
      snaps.push(stack.map(x => ({ n: x.n, skip: seen.has(x.n) })));
    }
  }
  return { order, snaps, parent };
}
