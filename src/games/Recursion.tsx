import { useEffect, useMemo, useState } from "react";
import {
  eventText,
  REC_CODE,
  recOptions,
  traceCalls,
  type RecEvent,
  type RecFn,
} from "../algorithms/recursion";
import { rnd } from "../lib/random";
import { useTimers } from "../hooks/useTimers";
import { CodePanel, Panel } from "./parts";
import type { GameProps } from "./types";

interface Frame {
  label: string;
  n: number;
  parts: number[];
}

const ROUNDS_BY_TIER: Record<number, () => { fn: RecFn; n: number }[]> = {
  1: () => [
    { fn: "fact", n: rnd(3, 5) },
    { fn: "fib", n: 3 },
  ],
  2: () => [
    { fn: "fact", n: 5 },
    { fn: "fib", n: 4 },
  ],
  3: () => [
    { fn: "fib", n: 4 },
    { fn: "fact", n: 6 },
  ],
};

export function RecursionGame({ api }: GameProps) {
  const later = useTimers();
  const [rounds] = useState(ROUNDS_BY_TIER[api.tier]);
  const [round, setRound] = useState(0);
  const { fn } = rounds[round];
  const ev = useMemo(
    () => traceCalls(rounds[round].fn, rounds[round].n),
    [rounds, round],
  );
  const [k, setK] = useState(1);
  const [stack, setStack] = useState<Frame[]>([
    { label: ev[0].label, n: ev[0].n, parts: [] },
  ]);
  const [log, setLog] = useState<RecEvent[]>([ev[0]]);
  useEffect(
    () =>
      api.say(
        <>
          Round {round + 1} of {rounds.length}. You called <b>{ev[0].label}</b>.
          What happens next?
        </>,
      ),
    [api, round, rounds.length, ev],
  );

  const top = stack[stack.length - 1];
  const options = useMemo(
    () => (k < ev.length && top ? recOptions(fn, top.n, eventText(ev[k])) : []),
    [fn, k, ev, top],
  );

  const pending = (f: Frame) => {
    if (f.n <= 1) return "base case";
    if (!api.assist) return "track it yourself";
    const p = (i: number) => f.parts[i] ?? "?";
    return fn === "fact" ? `${f.n} × ${p(0)}` : `${p(0)} + ${p(1)}`;
  };

  function pick(o: string) {
    if (api.over || k >= ev.length) return;
    const e = ev[k];
    const want = eventText(e);
    if (o !== want) {
      let why;
      if (e.t === "call" && o.startsWith("return"))
        why = (
          <>
            {top.label} can't return yet. It still needs the answer from{" "}
            <b>{e.label}</b>.
          </>
        );
      else if (e.t === "ret" && o.startsWith("call"))
        why =
          top.n <= 1
            ? `${top.label} is the base case. No more calls, just return ${e.v}.`
            : `${top.label} has every answer it needs (${e.how}). Time to return.`;
      else if (e.t === "ret")
        why = (
          <>
            {top.label} = {e.how} = <b>{e.v}</b>.
          </>
        );
      else
        why = (
          <>
            Read the code: the next call is <b>{e.label}</b>.
          </>
        );
      return api.wrong(
        <>
          Not <code>{o}</code>. {why}
        </>,
      );
    }
    setLog([...log, e]);
    setK(k + 1);
    if (e.t === "call") {
      setStack([...stack, { label: e.label, n: e.n, parts: [] }]);
      api.correct(
        10,
        `Pushed ${e.label} onto the stack. ${e.n <= 1 ? "That's the base case." : "It needs to call again before it can answer."}`,
      );
    } else {
      const rest = stack.slice(0, -1);
      const parent = rest[rest.length - 1];
      if (parent) {
        setStack([
          ...rest.slice(0, -1),
          { ...parent, parts: [...parent.parts, e.v!] },
        ]);
        api.correct(
          10,
          `${e.label} returned ${e.v} and popped off. ${parent.label} picks up where it paused.`,
        );
      } else {
        setStack([]);
        api.correct(
          20,
          <>
            {e.label} returned <b>{e.v}</b>. Stack empty. That's the whole trip.
          </>,
        );
      }
    }
    if (k + 1 >= ev.length) {
      if (round + 1 < rounds.length) {
        later(() => {
          const nextEv = traceCalls(rounds[round + 1].fn, rounds[round + 1].n);
          setRound(round + 1);
          setK(1);
          setStack([{ label: nextEv[0].label, n: nextEv[0].n, parts: [] }]);
          setLog([nextEv[0]]);
        }, 2000);
      } else api.finish();
    }
  }

  return (
    <>
      <div className="board">
        <div className="stacklbl">
          <span>Call stack</span>
          <span>
            {stack.length} frame{stack.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="frames">
          {stack.map((f, i) => (
            <div
              key={i}
              className={`frame ${i === stack.length - 1 ? "top" : ""}`}
            >
              <b>{f.label}</b>
              <span>
                {i === stack.length - 1 ? "running · " : "waiting · "}
                {pending(f)}
              </span>
            </div>
          ))}
        </div>
        <div className="stacklbl">
          <span>Bottom: first call</span>
          <span>Top: running now</span>
        </div>
        {options.length > 0 && (
          <div className="opts" style={{ marginTop: 14 }}>
            {options.map((o) => (
              <button key={o} onClick={() => pick(o)}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="side">
        <CodePanel title="The code" code={REC_CODE[fn]} />
        <Panel title="What's happened">
          <div className="trace">
            {log.map((e, i) => (
              <div
                key={i}
                style={{ paddingLeft: e.depth * 14 }}
                className={e.t === "ret" ? "r" : ""}
              >
                {e.t === "call"
                  ? `→ ${e.label}`
                  : `← ${e.label} returns ${e.v}`}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
