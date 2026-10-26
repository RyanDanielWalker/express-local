import { useEffect, useState } from "react";
import {
  binInit,
  binMaxChecks,
  binMid,
  binOver,
  binStep,
  type BinState,
} from "../algorithms/searching";
import { range, rnd, shuffle } from "../lib/random";
import { useTimers } from "../hooks/useTimers";
import { LINES } from "../data";
import { Rich } from "../components/Rich";
import { Panel, plural } from "./parts";
import type { GameProps } from "./types";

const ROUNDS = 3;

export function BinarySearchGame({ api }: GameProps) {
  const later = useTimers();
  const N = [0, 15, 23, 31][api.tier];
  const build = (round: number): BinState => {
    const arr = shuffle(range(1, 98))
      .slice(0, N)
      .sort((a, b) => a - b);
    if (round < ROUNDS - 1) return binInit(arr, arr[rnd(0, N - 1)]);
    const gaps = arr
      .slice(0, -1)
      .filter((v, i) => arr[i + 1] - v > 1)
      .map((v) => v + 1);
    return binInit(arr, gaps.length ? gaps[rnd(0, gaps.length - 1)] : 99);
  };
  const [round, setRound] = useState(0);
  const [s, setS] = useState(() => build(0));
  useEffect(
    () =>
      api.say(
        <>
          Array 1 of {ROUNDS}. Find <b>{s.target}</b>. Click the index binary
          search checks first.
        </>,
      ),
    [api],
  );

  function next() {
    if (round + 1 >= ROUNDS) return api.finish();
    later(() => {
      const b = build(round + 1);
      setRound(round + 1);
      setS(b);
      api.say(
        <>
          Array {round + 2} of {ROUNDS}. Find <b>{b.target}</b>.
        </>,
      );
    }, 2200);
  }

  function pick(i: number) {
    if (api.over || binOver(s)) return;
    const mid = binMid(s);
    if (i !== mid)
      return api.wrong(
        <>
          Not index {i}. mid = floor(({s.lo} + {s.hi}) / 2) = <b>{mid}</b>.
        </>,
      );
    const { state, result } = binStep(s, i);
    setS(state);
    const v = s.arr[i];
    if (result === "found") {
      api.correct(
        15,
        `arr[${i}] is ${v}. Found in ${plural(state.checks, "check")}.`,
      );
      return next();
    }
    if (v < s.target)
      api.correct(
        10,
        `arr[${i}] = ${v}, smaller than ${s.target}. Everything left of it is out: lo = ${state.lo}.`,
      );
    else
      api.correct(
        10,
        `arr[${i}] = ${v}, bigger than ${s.target}. Everything right of it is out: hi = ${state.hi}.`,
      );
    if (result === "absent") {
      api.say(
        <>
          lo ({state.lo}) passed hi ({state.hi}). The range is empty, so{" "}
          {s.target} isn't here. Return <b>-1</b>. Proving something's missing
          took only {plural(state.checks, "check")}.
        </>,
        "good",
      );
      next();
    }
  }

  const done = binOver(s);
  return (
    <>
      <div className="board">
        <div className="target">
          Find <span>{s.target}</span>
        </div>
        <div
          className="arr"
          style={{
            marginTop: 16,
            gridTemplateColumns: `repeat(${Math.min(N, 16)}, minmax(0,1fr))`,
          }}
        >
          {s.arr.map((v, i) => {
            const out = i < s.lo || i > s.hi;
            const ptr =
              api.assist && !done
                ? [i === s.lo ? "lo" : "", i === s.hi ? "hi" : ""]
                    .filter(Boolean)
                    .join("/")
                : "";
            return (
              <div className="cell" key={i}>
                <button
                  className={`${i === s.found ? "hit" : ""} ${s.checked.includes(i) && i !== s.found ? "checked" : ""}`}
                  disabled={(out && i !== s.found) || done}
                  aria-label={`index ${i}, value ${v}`}
                  onClick={() => pick(i)}
                >
                  {v}
                </button>
                <span className="ix">{i}</span>
                <span className="ptr">{ptr}</span>
              </div>
            );
          })}
        </div>
        <p className="hint">
          Grayed-out values have been ruled out. You never need to look at them
          again.
        </p>
      </div>
      <div className="side">
        <Panel title="Pointers">
          <div className="mono" style={{ lineHeight: 1.8 }}>
            {api.assist ? (
              <>
                lo = {s.lo}
                <br />
                hi = {s.hi}
                <br />
              </>
            ) : (
              <>
                lo, hi: in your head on Rush Hour
                <br />
              </>
            )}
            checks = {s.checks}
          </div>
        </Panel>
        <Panel title="Why it's fast">
          <p style={{ margin: 0 }}>
            {N} items never need more than <b>{binMaxChecks(N)}</b> checks,
            because each check halves what's left. Checking one by one could
            take {N}.
          </p>
        </Panel>
        <Panel title="Remember it">
          <p style={{ margin: 0 }}>
            <Rich text={LINES[3].hook} />
          </p>
        </Panel>
      </div>
    </>
  );
}
