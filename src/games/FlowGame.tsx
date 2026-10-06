import { useEffect, useState } from 'react';
import { nextStep, pickFlows } from '../engine/questions';
import type { Flow } from '../engine/types';
import { useTimers } from '../hooks/useTimers';
import { Rich } from '../components/Rich';
import { shuffle } from '../lib/random';
import { Panel } from './parts';
import type { GameProps } from './types';

/** Put the steps of a process back in order. One wrong guess names the right step. */
export function FlowGame({ api, line }: GameProps) {
  const later = useTimers();
  const [flows] = useState<Flow[]>(() => pickFlows(line.flows ?? [], api.tier));
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [tray, setTray] = useState<string[]>(() => shuffle([...(flows[0]?.steps ?? [])]));
  const [done, setDone] = useState(false);
  useEffect(() => api.say('Click the stages in the order they actually run.'), [api]);

  const flow = flows[i];
  if (!flow) return null;

  function pick(step: string) {
    if (api.over || done) return;
    const want = nextStep(flow, placed);
    if (step !== want) return api.wrong(<>Not yet. <b>{want}</b> comes next here.</>);
    const next = [...placed, step];
    setPlaced(next);
    api.correct(8, `${step}. Keep going.`);
    if (next.length < flow.steps.length) return;
    setDone(true);
    api.say(<>Full order. {flow.note}</>, 'good');
    later(() => {
      if (api.over) return;
      if (i + 1 >= flows.length) return api.finish();
      setI(i + 1);
      setPlaced([]);
      setTray(shuffle([...flows[i + 1].steps]));
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
          <div className="flow">
            {placed.length === 0 && <div className="slot"><span className="n">1</span>What runs first?</div>}
            {placed.map((s, k) => (
              <div key={s} className="slot done"><span className="n">{k + 1}</span>{s}</div>
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
        <Panel title="Remember it"><p style={{ margin: 0 }}><Rich text={line.hook} /></p></Panel>
      </div>
    </>
  );
}
