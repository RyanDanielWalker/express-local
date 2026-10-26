import { useEffect, useState } from "react";
import {
  quickInit,
  quickNextRange,
  quickShouldSend,
  quickStep,
  type QuickState,
} from "../algorithms/sorting";
import { range, shuffle } from "../lib/random";
import { useTimers } from "../hooks/useTimers";
import { useKeys } from "../hooks/useKeys";
import { CodePanel, Kbd, Panel } from "./parts";
import type { GameProps } from "./types";

const rangeIntro = (s: QuickState, n: number) => (
  <>
    Partitioning positions {s.lo} to {s.hi}
    {s.lo === 0 && s.hi === n - 1 ? " (the whole array)" : ""}. The pivot is{" "}
    <b>{s.pivot}</b>, the last value in this range. Goal: every value ≤{" "}
    {s.pivot} ends up on its left. First up: is {s.a[s.j]} ≤ {s.pivot}?
  </>
);

export function QuickSortGame({ api }: GameProps) {
  const later = useTimers();
  const N = [0, 8, 10, 12][api.tier];
  const [s, setS] = useState<QuickState>(() => {
    let a: number[];
    do a = shuffle(range(1, 24)).slice(0, N);
    while (a.every((v, i) => !i || a[i - 1] < v));
    return quickInit(a);
  });
  useEffect(() => api.say(rangeIntro(s, N)), [api]);
  const max = Math.max(...s.a);

  function decide(send: boolean) {
    if (api.over || !s.active) return;
    const v = s.a[s.j];
    if (send !== quickShouldSend(s))
      return api.wrong(
        send
          ? `${v} > ${s.pivot}. Big values stay where they are.`
          : `${v} ≤ ${s.pivot}, so it belongs in the left zone. Send it.`,
      );
    const step = quickStep(s, send);
    setS(step.state);
    api.correct(5);
    if (step.placed === null)
      return api.say(
        `${send ? "Sent left." : "Left it."} Is ${step.state.a[step.state.j]} ≤ ${s.pivot}?`,
        "good",
      );
    api.say(
      `Scan done. Pivot ${s.pivot} swaps into position ${step.placed}. Everything left of it is smaller, everything right is bigger. It's home for good.`,
      "good",
    );
    later(() => {
      const next = quickNextRange(step.state);
      setS(next);
      if (next.done) {
        api.say(
          `Sorted in ${next.comps} comparisons. Every value got its turn being "home".`,
          "good",
        );
        api.finish();
      } else api.say(rangeIntro(next, N));
    }, 1800);
  }

  useKeys((e) => {
    if (e.key === "s" || e.key === "S") decide(true);
    if (e.key === "k" || e.key === "K") decide(false);
  });

  const pending = s.todo
    .filter(([l, h]) => h > l)
    .map(([l, h]) => `[${l}..${h}]`)
    .reverse();
  const legend: [string, string][] = [
    ["var(--c)", "pivot"],
    ["var(--yellow)", "checking"],
    ["color-mix(in srgb, var(--c) 32%, var(--tile))", "≤ pivot zone"],
    ["color-mix(in srgb, var(--good) 45%, var(--tile))", "home"],
  ];
  return (
    <>
      <div className="board">
        <div className="qs">
          <div className="bars">
            {s.a.map((v, k) => {
              const cls = s.home.includes(k)
                ? "done"
                : k < s.lo || k > s.hi
                  ? "out"
                  : k === s.hi
                    ? "pv"
                    : k === s.j
                      ? "cmp"
                      : k <= s.i
                        ? "zone"
                        : "";
              return (
                <div key={k} className={`bar ${cls}`}>
                  <b>{v}</b>
                  <i style={{ height: `${Math.round((v / max) * 80) + 8}%` }} />
                  <small>{k}</small>
                </div>
              );
            })}
          </div>
        </div>
        <div className="decide">
          <button
            className="btn"
            disabled={!s.active}
            onClick={() => decide(true)}
          >
            Send left <Kbd>S</Kbd>
          </button>
          <button
            className="btn ghost"
            disabled={!s.active}
            onClick={() => decide(false)}
          >
            Leave it <Kbd>K</Kbd>
          </button>
        </div>
      </div>
      <div className="side">
        <Panel title="Key">
          <div className="legend">
            {legend.map(([sw, label]) => (
              <span key={label} style={{ ["--sw" as string]: sw }}>
                {label}
              </span>
            ))}
          </div>
        </Panel>
        <CodePanel
          title="Partition"
          code={`const pivot = a[hi];
let i = lo - 1;
for (let j = lo; j < hi; j++) {
  if (a[j] <= pivot) {
    i++; swap(a, i, j);
  }
}
swap(a, i + 1, hi); // pivot home`}
        />
        <Panel title="Ranges still to sort">
          <div className="mono">{pending.join(" ") || "none"}</div>
          <p className="hint" style={{ marginBottom: 0 }}>
            That's the recursion, waiting on the call stack.
          </p>
        </Panel>
      </div>
    </>
  );
}
