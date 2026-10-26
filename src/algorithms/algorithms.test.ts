import { describe, expect, it } from "vitest";
import { makeGraph, traverse } from "./graph";
import { eventText, recOptions, recValue, traceCalls } from "./recursion";
import {
  bubbleInit,
  bubbleShouldSwap,
  bubbleStep,
  mergeCommit,
  mergeInit,
  mergeTake,
  mergeWant,
  quickInit,
  quickNextRange,
  quickShouldSend,
  quickStep,
} from "./sorting";
import {
  binInit,
  binMaxChecks,
  binMid,
  binOver,
  binStep,
  hasPair,
  hashOf,
  lookup,
  twoInit,
  twoStep,
  twoWant,
} from "./searching";
import {
  dijBuild,
  dijClosest,
  dijFromEdges,
  dijPath,
  dijPick,
  dijRelax,
  dijShouldUpdate,
} from "./dijkstra";
import { splitPools, sqNext, sqPatterns, sqRemove } from "./stackQueue";
import { range, shuffle } from "../lib/random";

const sorted = (a: number[]) => [...a].sort((x, y) => x - y);
const randomValues = (n: number) => shuffle(range(1, 60)).slice(0, n);

describe("stack vs queue", () => {
  it("a stack gives back the newest, a queue the oldest", () => {
    expect(sqNext("stack", [4, 9, 2])).toBe(2);
    expect(sqNext("queue", [4, 9, 2])).toBe(4);
    expect(sqRemove("queue", [4, 9, 2])).toEqual([9, 2]);
  });

  it("each script gets one value per push, and no value is used twice", () => {
    const scripts = [...sqPatterns(1), ...sqPatterns(3)];
    const pools = splitPools(scripts, range(10, 98));
    pools.forEach((pool, i) =>
      expect(pool.length).toBe(scripts[i].filter((x) => x === "push").length),
    );
    expect(new Set(pools.flat()).size).toBe(pools.flat().length);
  });
});

describe("graph traversal", () => {
  //     0
  //   1   2
  //  3 4   5
  const adj = [[1, 2], [0, 3, 4], [0, 5], [1], [1, 5], [2, 4]];

  it("BFS visits level by level", () => {
    expect(traverse(adj, "bfs").order).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("DFS dives down the first branch before backing up", () => {
    const t = traverse(adj, "dfs");
    expect(t.order).toEqual([0, 1, 3, 4, 5, 2]);
    expect(t.parent[5]).toBe(4);
  });

  it("DFS snapshots flag entries that were already visited", () => {
    const t = traverse(adj, "dfs");
    expect(t.snaps.some((s) => s.some((e) => e.skip))).toBe(true);
  });

  it("generated graphs are connected and every node gets visited", () => {
    for (let i = 0; i < 50; i++) {
      const g = makeGraph(1 + (i % 3));
      expect(traverse(g.adj, "bfs").order).toHaveLength(g.nodes.length);
      expect(traverse(g.adj, "dfs").order).toHaveLength(g.nodes.length);
    }
  });
});

describe("recursion", () => {
  it("traces fib(3) call by call", () => {
    expect(traceCalls("fib", 3).map(eventText)).toEqual([
      "call fib(3)",
      "call fib(2)",
      "call fib(1)",
      "return 1",
      "call fib(0)",
      "return 0",
      "return 1",
      "call fib(1)",
      "return 1",
      "return 2",
    ]);
  });

  it("computes values", () => {
    expect(recValue("fact", 5)).toBe(120);
    expect(recValue("fib", 6)).toBe(8);
  });

  it("offers the right answer among three distinct options", () => {
    const opts = recOptions("fact", 3, "call fact(2)");
    expect(opts).toContain("call fact(2)");
    expect(new Set(opts).size).toBe(3);
  });
});

describe("bubble sort", () => {
  it("sorts when every decision is right, and rejects wrong ones", () => {
    for (let r = 0; r < 30; r++) {
      const input = randomValues(7);
      let s = bubbleInit(input);
      expect(bubbleStep(s, !bubbleShouldSwap(s)).ok).toBe(false);
      while (!s.done) s = bubbleStep(s, bubbleShouldSwap(s)).state;
      expect(s.a).toEqual(sorted(input));
    }
  });

  it("exits early on an already sorted pass", () => {
    let s = bubbleInit([1, 2, 3, 5, 4]);
    while (!s.done) s = bubbleStep(s, bubbleShouldSwap(s)).state;
    expect(s.earlyExit).toBe(true);
    expect(s.comps).toBeLessThan(10);
  });
});

describe("quicksort", () => {
  it("each partition puts the pivot home, and the whole array ends up sorted", () => {
    for (let r = 0; r < 30; r++) {
      const input = randomValues(10);
      let s = quickInit(input);
      while (!s.done) {
        if (!s.active) s = quickNextRange(s);
        else {
          const step = quickStep(s, quickShouldSend(s));
          if (step.placed !== null) {
            const p = step.placed;
            const { a } = step.state;
            for (let k = s.lo; k < p; k++)
              expect(a[k]).toBeLessThanOrEqual(a[p]);
            for (let k = p + 1; k <= s.hi; k++)
              expect(a[k]).toBeGreaterThan(a[p]);
          }
          s = step.state;
        }
      }
      expect(s.a).toEqual(sorted(input));
    }
  });
});

describe("merge sort", () => {
  it.each([8, 12, 16, 5])("merges %i values back into sorted order", (n) => {
    const input = randomValues(n);
    let s = mergeInit(input);
    while (!s.done) {
      const step = mergeTake(s, mergeWant(s));
      expect(mergeTake(s, mergeWant(s) === "L" ? "R" : "L").ok).toBe(false);
      s = step.pairDone ? mergeCommit(step.state) : step.state;
    }
    expect(s.runs[0]).toEqual(sorted(input));
    expect(s.level).toBe(Math.ceil(Math.log2(n)));
  });
});

describe("binary search", () => {
  it("finds a present target within the worst-case check count", () => {
    const arr = sorted(randomValues(31));
    for (const target of arr) {
      let s = binInit(arr, target);
      while (!binOver(s)) s = binStep(s, binMid(s)).state;
      expect(s.found).toBe(arr.indexOf(target));
      expect(s.checks).toBeLessThanOrEqual(binMaxChecks(31));
    }
  });

  it("proves a missing target is absent", () => {
    let s = binInit([1, 3, 5, 7, 9], 4);
    let last;
    while (!binOver(s)) ({ state: s, result: last } = binStep(s, binMid(s)));
    expect(last).toBe("absent");
    expect(s.found).toBeNull();
  });

  it("rejects any index that is not mid", () => {
    const s = binInit([1, 2, 3, 4, 5], 5);
    expect(binStep(s, 4).ok).toBe(false);
  });
});

describe("two pointers", () => {
  it("finds a pair when one exists and proves it when none does", () => {
    for (let r = 0; r < 50; r++) {
      const a = sorted(randomValues(12));
      const target = r % 2 ? a[2] + a[9] : 1000;
      let s = twoInit(a, target);
      let result;
      while (!s.over) ({ state: s, result } = twoStep(s, twoWant(s)));
      expect(result === "found").toBe(hasPair(a, target));
      expect(s.checks).toBeLessThanOrEqual(a.length);
    }
  });
});

describe("hashing", () => {
  it("uses the remainder as the bucket", () => {
    expect(hashOf(47, 10)).toBe(7);
    expect(hashOf(47, 7)).toBe(5);
  });
  it("counts comparisons inside one bucket", () => {
    expect(lookup([17, 47, 27], 47)).toEqual({ found: true, comparisons: 2 });
    expect(lookup([17, 47], 57)).toEqual({ found: false, comparisons: 2 });
  });
});

describe("dijkstra", () => {
  /** Reference answer: Bellman-Ford style relaxation until nothing changes. */
  function reference(s: ReturnType<typeof dijBuild>): number[] {
    const d = s.dist.map((_, k) => (k ? Infinity : 0));
    for (let round = 0; round < d.length; round++)
      for (const { u, v, w } of s.edges) {
        if (d[u] + w < d[v]) d[v] = d[u] + w;
        if (d[v] + w < d[u]) d[u] = d[v] + w;
      }
    return d;
  }

  it("playing it perfectly produces true shortest distances", () => {
    for (let r = 0; r < 40; r++) {
      let s = dijBuild(1 + (r % 3));
      const truth = reference(s);
      while (s.phase !== "done") {
        s =
          s.phase === "pick"
            ? dijPick(s, dijClosest(s)[0]).state
            : dijRelax(s, dijShouldUpdate(s)).state;
      }
      expect(s.dist).toEqual(truth);
      const path = dijPath(s, 6);
      expect(path[0]).toBe(0);
      expect(path.at(-1)).toBe(6);
    }
  });

  it("refuses to settle a station that is not the closest", () => {
    const s = dijFromEdges([
      { u: 0, v: 1, w: 1 },
      { u: 0, v: 2, w: 5 },
      { u: 1, v: 3, w: 1 },
      { u: 2, v: 4, w: 1 },
      { u: 3, v: 5, w: 1 },
      { u: 4, v: 6, w: 1 },
    ]);
    const a = dijPick(s, 0).state;
    const b = dijRelax(dijRelax(a, true).state, true).state;
    expect(dijPick(b, 2)).toMatchObject({ ok: false, reason: "notClosest" });
    expect(dijPick(b, 1).ok).toBe(true);
  });
});
