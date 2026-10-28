import { useEffect, useState } from "react";
import {
  sqNext,
  sqPatterns,
  sqRemove,
  splitPools,
  type SqMode,
  type SqOp,
} from "../algorithms/stackQueue";
import { range, rnd, shuffle } from "../lib/random";
import { useTimers } from "../hooks/useTimers";
import { LINES } from "../data";
import { Rich } from "../components/Rich";
import { Panel } from "./parts";
import type { GameProps } from "./types";

interface Scenario {
  mode: SqMode;
  steps: SqOp[];
  /** The values this scenario pushes, in order. */
  pool: number[];
  k: number;
  items: number[];
  log: { op: SqOp; v?: number }[];
  display: number[];
  last?: { mode: SqMode; before: number[]; out: number };
}

/** Run pushes until the next remove. Returns null when the script is done. */
function advance(sc: Scenario): Scenario | null {
  let { k, items, log } = sc;
  while (k < sc.steps.length && sc.steps[k] === "push") {
    const v = sc.pool[log.filter((e) => e.op === "push").length];
    items = [...items, v];
    log = [...log, { op: "push", v }];
    k++;
  }
  if (k >= sc.steps.length) return null;
  return {
    ...sc,
    k,
    items,
    log: [...log, { op: "pop" }],
    display: shuffle([...items]),
  };
}

export function StackQueueGame({ api }: GameProps) {
  const later = useTimers();
  const [plan] = useState(() => {
    const patterns = sqPatterns(api.tier);
    const modes = shuffle(
      range(0, [0, 4, 5, 6][api.tier] - 1).map((x): SqMode =>
        x % 2 ? "stack" : "queue",
      ),
    );
    const scripts = modes.map(() => patterns[rnd(0, patterns.length - 1)]);
    return {
      modes,
      scripts,
      pools: splitPools(scripts, shuffle(range(10, 98))),
      total: scripts.reduce(
        (a, s) => a + s.filter((x) => x === "pop").length,
        0,
      ),
    };
  });
  const fresh = (si: number) =>
    advance({
      mode: plan.modes[si],
      steps: plan.scripts[si],
      pool: plan.pools[si],
      k: 0,
      items: [],
      log: [],
      display: [],
    })!;

  const [si, setSi] = useState(0);
  const [sc, setSc] = useState<Scenario>(() => fresh(0));
  useEffect(
    () =>
      api.say(
        "Read the log. Tiles are shuffled so you can't cheat off the picture.",
      ),
    [api],
  );
  const [answered, setAnswered] = useState(0);
  const take = sc.mode === "stack" ? "pop" : "shift";

  function pick(v: number) {
    if (api.over || !sc.display.length) return;
    const want = sqNext(sc.mode, sc.items);
    if (v !== want) {
      api.wrong(
        sc.mode === "stack" ? (
          <>
            Not {v}. A stack pops the <b>most recent</b> push. Scan the log from
            the bottom up.
          </>
        ) : (
          <>
            Not {v}. A queue shifts out whatever's been waiting <b>longest</b>:
            the earliest push still inside.
          </>
        ),
      );
      return;
    }
    const log = [...sc.log];
    log[log.length - 1] = { op: "pop", v };
    const done: Scenario = {
      ...sc,
      last: { mode: sc.mode, before: sc.items, out: v },
      items: sqRemove(sc.mode, sc.items),
      log,
      k: sc.k + 1,
      display: [],
    };
    setAnswered((a) => a + 1);
    api.correct(
      10,
      sc.mode === "stack"
        ? `Yes. ${v} was pushed last, so it pops first.`
        : `Yes. ${v} got in line first, so it leaves first.`,
    );
    const next = advance(done);
    if (next) return setSc(next);
    setSc(done);
    if (si + 1 < plan.modes.length)
      later(() => {
        setSi(si + 1);
        setSc((prev) => ({ ...fresh(si + 1), last: prev.last }));
      }, 900);
    else api.finish();
  }

  const last = sc.last;
  return (
    <>
      <div className="board">
        <span className="mode">{sc.mode}</span>
        <ol className="log">
          {sc.log.map((e, i) =>
            e.op === "push" ? (
              <li key={i}>
                {sc.mode}.push({e.v})
              </li>
            ) : (
              <li key={i} className="q">
                {sc.mode}.{take}() →{" "}
                {e.v != null ? (
                  <span className="ans">{e.v}</span>
                ) : (
                  <span className="qm">?</span>
                )}
              </li>
            ),
          )}
        </ol>
        <div className="tiles">
          {sc.display.map((v) => (
            <button key={v} className="tile" onClick={() => pick(v)}>
              {v}
            </button>
          ))}
        </div>
        <p className="hint">
          {sc.display.length
            ? `Question ${answered + 1} of ${plan.total}. Which value comes out?`
            : "Next scenario coming up."}
        </p>
      </div>
      <div className="side">
        <Panel title="What it really looked like">
          {last ? (
            <>
              <div className="chips">
                <span className="bracket">[</span>
                {last.before.map((v) => (
                  <span
                    key={v}
                    className={v === last.out ? "chip out" : "chip"}
                  >
                    {v}
                  </span>
                ))}
                <span className="bracket">]</span>
              </div>
              <div className="ends">
                <span>index 0 · shift() takes here</span>
                <span>pop() takes here</span>
              </div>
              <p className="hint" style={{ marginBottom: 0 }}>
                {last.mode === "stack"
                  ? "Stack: newest one leaves. Same end it went in."
                  : "Queue: oldest one leaves. It's been waiting longest."}
              </p>
            </>
          ) : (
            <p className="hint" style={{ margin: 0 }}>
              Answer one and the real array shows up here.
            </p>
          )}
        </Panel>
        <Panel title="Remember it">
          <p style={{ margin: 0 }}>
            <Rich text={LINES[0].hook} />
          </p>
        </Panel>
      </div>
    </>
  );
}
