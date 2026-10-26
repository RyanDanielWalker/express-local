import { useEffect, useState } from "react";
import {
  mergeCommit,
  mergeInit,
  mergeTake,
  mergeWant,
  type MergeState,
} from "../algorithms/sorting";
import { range, shuffle } from "../lib/random";
import { useTimers } from "../hooks/useTimers";
import { CodePanel, Mono, Panel } from "./parts";
import type { GameProps } from "./types";

export function MergeSortGame({ api }: GameProps) {
  const later = useTimers();
  const N = [0, 8, 12, 16][api.tier];
  const LEVELS = Math.ceil(Math.log2(N));
  const [s, setS] = useState<MergeState>(() =>
    mergeInit(shuffle(range(1, 60)).slice(0, N)),
  );
  const [busy, setBusy] = useState(false);
  useEffect(
    () =>
      api.say(
        `Split all the way down: ${N} runs of one item. A single item is already sorted, so now you merge them back together, pair by pair.`,
      ),
    [api, N],
  );

  function pick(side: "L" | "R", x: number) {
    if (api.over || busy || !s.left || !s.right) return;
    if (x !== (side === "L" ? s.i : s.j))
      return api.say(
        "Only the fronts (outlined) are in play. Each run is sorted, so its front is its smallest.",
        "bad",
      );
    const a = s.left[s.i];
    const b = s.right[s.j];
    if (side !== mergeWant(s))
      return api.wrong(
        <>
          {a} vs {b}: take the smaller one, <b>{Math.min(a, b)}</b>.
        </>,
      );
    const step = mergeTake(s, side);
    setS(step.state);
    api.correct(5);
    if (!step.pairDone)
      return api.say(
        `Next: ${step.state.left![step.state.i]} vs ${step.state.right![step.state.j]}?`,
        "good",
      );
    const ranOut =
      s.i + (side === "L" ? 1 : 0) >= s.left.length ? "Left" : "Right";
    api.say(
      step.flushed.length
        ? `${ranOut} ran out, so ${step.flushed.join(", ")} slide${step.flushed.length > 1 ? "" : "s"} in as-is. Already sorted, no comparing needed.`
        : "Merged.",
      "good",
    );
    setBusy(true);
    later(() => {
      const next = mergeCommit(step.state);
      setS(next);
      setBusy(false);
      if (next.done) {
        api.say(
          <>
            Sorted: <Mono>{next.runs[0].join(", ")}</Mono>. {LEVELS} levels ×{" "}
            {N} values each = n log n.
          </>,
          "good",
        );
        api.finish();
      }
    }, 1300);
  }

  const lane = (name: string, arr: number[], ptr: number, side: "L" | "R") => (
    <div className="lane">
      <span>{name}</span>
      <div className="chips">
        {arr.map((v, x) => (
          <button
            key={x}
            className={`chip ${x < ptr ? "used" : ""} ${x === ptr ? "front" : ""}`}
            disabled={x < ptr}
            onClick={() => pick(side, x)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="board">
        <div className="eyebrow">
          Level {Math.min(s.level, LEVELS)} of {LEVELS} · merging runs of{" "}
          {s.runs[0]?.length ?? N}
        </div>
        <div className="runs" style={{ marginTop: 8 }}>
          {s.runs.map((r, x) => (
            <div
              key={x}
              className={`run ${x < s.p * 2 && !s.done ? "done" : ""} ${s.left && (x === s.p * 2 || x === s.p * 2 + 1) ? "active" : ""}`}
            >
              {r.map((v) => (
                <span key={v} className="chip">
                  {v}
                </span>
              ))}
            </div>
          ))}
        </div>
        {s.left && s.right && (
          <>
            {lane("Left", s.left, s.i, "L")}
            {lane("Right", s.right, s.j, "R")}
            <div className="lane">
              <span>Merged</span>
              <div className="chips">
                {s.out.length ? (
                  s.out.map((v) => (
                    <span key={v} className="chip out">
                      {v}
                    </span>
                  ))
                ) : (
                  <span className="hint" style={{ margin: 0 }}>
                    empty
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="side">
        <CodePanel
          title="The merge"
          code={`while (i < left.length &&
       j < right.length) {
  if (left[i] <= right[j])
    out.push(left[i++]);
  else out.push(right[j++]);
}
// copy whatever's left over`}
        />
        <Panel title="Pointers">
          <div className="mono" style={{ lineHeight: 1.8 }}>
            i = {s.i}
            <br />j = {s.j}
          </div>
        </Panel>
        <Panel title="Why n log n">
          <p style={{ margin: 0 }}>
            Halving {N} takes {LEVELS} levels. Each level moves all {N} values
            once.
          </p>
        </Panel>
      </div>
    </>
  );
}
