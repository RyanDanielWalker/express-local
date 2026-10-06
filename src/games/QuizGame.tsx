import { useEffect, useState } from 'react';
import { pickQuestions } from '../engine/questions';
import type { Question } from '../engine/types';
import { useTimers } from '../hooks/useTimers';
import { Rich } from '../components/Rich';
import { shuffle } from '../lib/random';
import { Panel } from './parts';
import type { GameProps } from './types';

/** Multiple choice drill. Wrong costs a heart, and always shows why. */
export function QuizGame({ api, line }: GameProps) {
  const later = useTimers();
  const [items] = useState<Question[]>(() => pickQuestions(line.questions ?? [], api.tier));
  const [i, setI] = useState(0);
  const [opts, setOpts] = useState<string[]>(() => shuffle([...(items[0]?.opts ?? [])]));
  const [picked, setPicked] = useState<string | null>(null);
  const [marks, setMarks] = useState<('ok' | 'no')[]>([]);
  useEffect(() => api.say('Pick the answer you would give out loud in an interview.'), [api]);

  const q = items[i];
  if (!q) return null;

  function choose(o: string) {
    if (api.over || picked) return;
    const ok = o === q.a;
    setPicked(o);
    setMarks(m => [...m, ok ? 'ok' : 'no']);
    if (ok) api.correct(10, 'Correct.');
    else api.wrong(<>Not quite. Read the reason, then keep moving.</>);
    later(() => {
      if (api.over) return;
      if (i + 1 >= items.length) return api.finish();
      setI(i + 1);
      setOpts(shuffle([...items[i + 1].opts]));
      setPicked(null);
    }, ok ? 1500 : 3400);
  }

  return (
    <>
      <div className="board">
        <div className="qcard">
          <div className="progress" aria-hidden="true">
            {items.map((_, k) => <i key={k} className={marks[k] ?? (k === i ? 'now' : '')} />)}
          </div>
          <div className="eyebrow">Question {i + 1} of {items.length}</div>
          <p className="q"><Rich text={q.q} /></p>
          {q.code && <pre className="code">{q.code}</pre>}
          <div className="opts stack">
            {opts.map(o => (
              <button
                key={o}
                disabled={!!picked}
                className={picked && o === q.a ? 'right' : picked === o ? 'wrongpick' : ''}
                onClick={() => choose(o)}
              >
                <Rich text={o} />
              </button>
            ))}
          </div>
          {picked && (
            <div className="why">
              <b>{picked === q.a ? 'Right' : 'The answer is: ' + q.a}</b>
              <Rich text={q.why} />
            </div>
          )}
        </div>
      </div>
      <div className="side">
        <Panel title="Remember it"><p style={{ margin: 0 }}><Rich text={line.hook} /></p></Panel>
        <Panel title="Scoring">
          <div className="mono" style={{ lineHeight: 1.8 }}>
            right = {marks.filter(m => m === 'ok').length}<br />
            wrong = {marks.filter(m => m === 'no').length}<br />
            left = {items.length - marks.length}
          </div>
        </Panel>
      </div>
    </>
  );
}
