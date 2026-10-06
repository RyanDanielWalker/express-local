import { useEffect, useState } from 'react';
import { nextStep, pickFlows } from '../engine/questions';
import type { Flow } from '../engine/types';
import { useTimers } from '../hooks/useTimers';
import { Rich } from '../components/Rich';
import { shuffle } from '../lib/random';
import { Panel } from './parts';
import type { GameProps } from './types';

/** Steps already on the board when a puzzle opens (`start`), so it begins mid-flight. */
const given = (flow?: Flow): string[] => flow?.steps.slice(0, flow.start ?? 0) ?? [];

/** Everything the player can click: what is left to place, plus steps that never happen here. */
const trayFor = (flow?: Flow): string[] =>
  shuffle([...(flow?.steps.slice(flow.start ?? 0) ?? []), ...(flow?.decoys ?? [])]);

/** Put the steps of a process back in order. One wrong guess names the right step. */
export function FlowGame({ api, line }: GameProps) {
  const later = useTimers();
  const [flows] = useState<Flow[]>(() => pickFlows(line.flows ?? [], api.tier));
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<string[]>(() => given(flows[0]));
  const [tray, setTray] = useState<string[]>(() => trayFor(flows[0]));
  const [done, setDone] = useState(false);
  useEffect(() => api.say('Click the stages in the order they actually run.'), [api]);

  const flow = flows[i];
  if (!flow) return null;
  const head = flow.start ?? 0;

  function pick(step: string) {
    if (api.over || done) return;
    const want = nextStep(flow, placed);
    // A decoy has no place in this run at all, so say that rather than "not yet".
    if (step !== want) {
      return api.wrong(
        flow.decoys?.includes(step)
          ? <><b>{step}</b> does not happen here. <b>{want}</b> is next.</>
          : <>Not yet. <b>{want}</b> comes next here.</>,
      );
    }
    const next = [...placed, step];
    setPlaced(next);
    api.correct(8, `${step}. Keep going.`);
    if (next.length < flow.steps.length) return;
    setDone(true);
    api.say(<>Full order. {flow.note}</>, 'good');
    later(() => {
      if (api.over) return;
      if (i + 1 >= flows.length) return api.finish();
      const n = flows[i + 1];
      setI(i + 1);
      setPlaced(given(n));
      setTray(trayFor(n));
      setDone(false);
    }, 3600);
  }

  return (
    <>
      <div className="board">
        <div className="qcard">
          <div className="progress" aria-hidden="true">
            {flows.map((_, k) => <i key={k} className={k < i ? 'ok' : k === i ? 'now' : ''} />)}
          </div>
          <div className="eyebrow">Order {i + 1} of {flows.length}</div>
          <p className="scenario"><Rich text={flow.title} /></p>
          {head > 0 && <p className="hint">That much already happened. Keep it going from there.</p>}
          <div className="flow">
            {placed.length === 0 && <div className="slot"><span className="n">1</span>What runs first?</div>}
            {placed.map((s, k) => (
              <div key={s} className={`slot done${k < head ? ' given' : ''}`}><span className="n">{k + 1}</span>{s}</div>
            ))}
          </div>
          <div className="steps">
            {tray.map(s => (
              <button key={s} disabled={placed.includes(s)} onClick={() => pick(s)}>{s}</button>
            ))}
          </div>
          {done && <div className="why"><b>Why that order</b><Rich text={flow.note} /></div>}
        </div>
      </div>
      <div className="side">
        {/* Never `line.hook` here: on an ordering puzzle the hook is the answer key. */}
        {api.assist && line.drill && (
          <Panel title="Think it through"><p style={{ margin: 0 }}><Rich text={line.drill} /></p></Panel>
        )}
      </div>
    </>
  );
}
