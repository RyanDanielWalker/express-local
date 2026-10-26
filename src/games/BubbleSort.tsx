import { useEffect, useEffectEvent, useState } from "react";
import {
  bubbleInit,
  bubbleShouldSwap,
  bubbleStep,
  type BubbleState,
} from "../algorithms/sorting";
import { range, shuffle } from "../lib/random";
import { useTimers } from "../hooks/useTimers";
import { useKeys } from "../hooks/useKeys";
import { LINES } from "../data";
import { Rich } from "../components/Rich";
import { Kbd, Panel } from "./parts";
import type { GameProps } from "./types";

export function BubbleSortGame({ api }: GameProps) {
  const later = useTimers();
  const SIZES = [[], [5, 6], [6, 7], [7, 8]][api.tier];
  const build = (round: number): BubbleState => {
    let a: number[];
    do a = shuffle(range(1, 19)).slice(0, SIZES[round]);
    while (a.every((v, i) => !i || a[i - 1] < v));
    return bubbleInit(a);
  };
  const [round, setRound] = useState(0);
  const [s, setS] = useState(() => build(0));
  // The opening message, once per ride. It reads the starting state
  // without re-running each time that state changes.
  const sayOpening = useEffectEvent(() =>
    api.say(
      `Array 1 of ${SIZES.length}. Pass 1: is ${s.a[0]} bigger than ${s.a[1]}?`,
    ),
  );
  useEffect(() => sayOpening(), [api]);
  const max = Math.max(...s.a);

  function decide(swap: boolean) {
    if (api.over || s.done) return;
    const should = bubbleShouldSwap(s);
    const [x, y] = [s.a[s.j], s.a[s.j + 1]];
    if (swap !== should)
      return api.wrong(
        should
          ? `${x} > ${y}, so they're out of order. Swap.`
          : `${x} < ${y}, already in order. Keep.`,
      );
    const { state, passEnded } = bubbleStep(s, swap);
    setS(state);
    api.correct(5);
    if (state.done) {
      api.say(
        state.earlyExit
          ? `A whole pass with zero swaps. It's sorted, so bubble sort exits early after ${state.comps} comparisons.`
          : `Sorted in ${state.comps} comparisons.`,
        "good",
      );
      if (round + 1 < SIZES.length)
        later(() => {
          const b = build(round + 1);
          setRound(round + 1);
          setS(b);
          api.say(
            `Array ${round + 2} of ${SIZES.length}. Pass 1: is ${b.a[0]} bigger than ${b.a[1]}?`,
          );
        }, 2000);
      else api.finish();
    } else if (passEnded) {
      const n = state.a.length;
      api.say(
        `Pass ${state.pass} done. ${state.a[n - state.pass]} is locked in place. Pass ${state.pass + 1}: ${state.a[0]} vs ${state.a[1]}?`,
        "good",
      );
    } else
      api.say(
        `${swap ? "Swapped." : "Kept."} Next: ${state.a[state.j]} vs ${state.a[state.j + 1]}?`,
        "good",
      );
  }

  useKeys((e) => {
    if (e.key === "s" || e.key === "S") decide(true);
    if (e.key === "k" || e.key === "K") decide(false);
  });

  const lockFrom = s.done ? 0 : s.a.length - s.pass;
  return (
    <>
      <div className="board">
        <div className="bars">
          {s.a.map((v, i) => (
            <div
              key={i}
              className={`bar ${!s.done && (i === s.j || i === s.j + 1) ? "cmp" : ""} ${i >= lockFrom ? "done" : ""}`}
            >
              <b>{v}</b>
              <i style={{ height: `${Math.round((v / max) * 85) + 8}%` }} />
            </div>
          ))}
        </div>
        <div className="decide">
          <button
            className="btn"
            disabled={s.done}
            onClick={() => decide(true)}
          >
            Swap <Kbd>S</Kbd>
          </button>
          <button
            className="btn ghost"
            disabled={s.done}
            onClick={() => decide(false)}
          >
            Keep <Kbd>K</Kbd>
          </button>
        </div>
        <p className="hint">Faded bars are locked in their final spot.</p>
      </div>
      <div className="side">
        <Panel title="Progress">
          <div className="mono" style={{ lineHeight: 1.8 }}>
            pass = {s.pass + 1}
            <br />
            comparisons = {s.comps}
            <br />
            swapped this pass = {String(s.swapped)}
          </div>
        </Panel>
        <Panel title="Watch for it">
          <p style={{ margin: 0 }}>
            Each pass carries the biggest unsorted value all the way right.
            After pass 1, {max} is home.
          </p>
        </Panel>
        <Panel title="Remember it">
          <p style={{ margin: 0 }}>
            <Rich text={LINES[4].hook} />
          </p>
        </Panel>
      </div>
    </>
  );
}
