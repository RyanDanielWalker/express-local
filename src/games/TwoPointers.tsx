import { useEffect, useEffectEvent, useState } from "react";
import {
  hasPair,
  twoInit,
  twoStep,
  twoSum,
  twoWant,
  type TwoMove,
  type TwoState,
} from "../algorithms/searching";
import { range, rnd, shuffle } from "../lib/random";
import { useTimers } from "../hooks/useTimers";
import { useKeys } from "../hooks/useKeys";
import { CodePanel, Kbd, Panel } from "./parts";
import type { GameProps } from "./types";

export function TwoPointersGame({ api }: GameProps) {
  const later = useTimers();
  const ROUNDS = api.tier === 3 ? 4 : 3;
  const N = [0, 10, 14, 18][api.tier];
  const build = (round: number): TwoState => {
    const a = shuffle(range(1, 39))
      .slice(0, N)
      .sort((x, y) => x - y);
    const present = () => {
      const p = rnd(0, N - 2);
      return a[p] + a[rnd(p + 1, N - 1)];
    };
    if (round < ROUNDS - 1) return twoInit(a, present());
    for (let tries = 0; tries < 300; tries++) {
      const target = rnd(a[0] + a[1], a[N - 1] + a[N - 2]);
      if (!hasPair(a, target)) return twoInit(a, target);
    }
    return twoInit(a, present());
  };
  const [round, setRound] = useState(0);
  const [s, setS] = useState(() => build(0));
  // The opening message, once per ride. It reads the starting state
  // without re-running each time that state changes.
  const sayOpening = useEffectEvent(() =>
    api.say(
      <>
        Array 1 of {ROUNDS}. Find two values that add to <b>{s.target}</b>.
      </>,
    ),
  );
  useEffect(() => sayOpening(), [api]);
  const pairs = (N * (N - 1)) / 2;

  function next() {
    if (round + 1 >= ROUNDS) return api.finish();
    later(() => {
      const b = build(round + 1);
      setRound(round + 1);
      setS(b);
      api.say(
        <>
          Array {round + 2} of {ROUNDS}. Find two values that add to{" "}
          <b>{b.target}</b>.
        </>,
      );
    }, 2200);
  }

  function move(m: TwoMove) {
    if (api.over || s.over) return;
    const sum = twoSum(s);
    const want = twoWant(s);
    const [x, y] = [s.a[s.lo], s.a[s.hi]];
    if (m !== want) {
      return api.wrong(
        `${x} + ${y} = ${sum}. ` +
          (want === "lo"
            ? "Too small. Only lo++ makes it bigger."
            : want === "hi"
              ? "Too big. Only hi-- makes it smaller."
              : `That's ${s.target}. You found it!`),
      );
    }
    const { state, result } = twoStep(s, m);
    setS(state);
    if (result === "found") {
      api.correct(
        20,
        `${x} + ${y} = ${s.target}. Found at [${s.lo}, ${s.hi}] in ${state.checks} checks.`,
      );
      return next();
    }
    api.correct(
      10,
      `${sum} is too ${m === "lo" ? "small" : "big"}, so ${m === "lo" ? "lo moves right" : "hi moves left"}.`,
    );
    if (result === "none") {
      api.say(
        `The pointers met. No two values add to ${s.target}. Proved it in ${state.checks} checks instead of ${pairs}.`,
        "good",
      );
      next();
    }
  }

  useKeys((e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move("lo");
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      move("hi");
    }
    if (e.key === "f" || e.key === "F") move("found");
  });

  return (
    <>
      <div className="board">
        <div className="target">
          Target{" "}
          <span style={{ background: "var(--c)", color: "#fff" }}>
            {s.target}
          </span>
        </div>
        <div
          className="arr"
          style={{
            gridTemplateColumns: `repeat(${Math.min(N, 10)}, minmax(0,1fr))`,
            marginTop: 16,
          }}
        >
          {s.a.map((v, k) => {
            const on = k === s.lo || k === s.hi;
            const out = k < s.lo || k > s.hi;
            return (
              <div className="cell" key={k}>
                <button
                  className={on ? "win" : ""}
                  disabled
                  style={{ opacity: out ? 0.25 : 1 }}
                >
                  {v}
                </button>
                <span className="ix">{k}</span>
                <span className="ptr">
                  {[k === s.lo ? "lo" : "", k === s.hi ? "hi" : ""]
                    .filter(Boolean)
                    .join("/")}
                </span>
              </div>
            );
          })}
        </div>
        <div className="sum">
          a[lo] + a[hi] = {s.a[s.lo]} + {s.a[s.hi]} ={" "}
          <span
            className="qm"
            style={{
              background: "var(--yellow)",
              color: "#15181C",
              padding: "0 6px",
              borderRadius: 4,
            }}
          >
            ?
          </span>
        </div>
        <div className="moves">
          <button className="btn" disabled={s.over} onClick={() => move("lo")}>
            lo++ <Kbd>→</Kbd>
          </button>
          <button className="btn" disabled={s.over} onClick={() => move("hi")}>
            hi-- <Kbd>←</Kbd>
          </button>
          <button
            className="btn ghost"
            disabled={s.over}
            onClick={() => move("found")}
          >
            Found <Kbd>F</Kbd>
          </button>
        </div>
      </div>
      <div className="side">
        <CodePanel
          title="The code"
          code={`while (lo < hi) {
  const sum = a[lo] + a[hi];
  if (sum < target) lo++;
  else if (sum > target) hi--;
  else return [lo, hi];
}
return null;`}
        />
        <Panel title="Checks">
          <div className="mono">
            {s.checks} so far · brute force: up to {pairs}
          </div>
        </Panel>
        <Panel title="Why it works">
          <p style={{ margin: 0 }}>
            If a[lo] + a[hi] is too small, a[lo] is too small even with the
            biggest partner left. So a[lo] can never be in the answer. Toss it.
          </p>
        </Panel>
      </div>
    </>
  );
}
