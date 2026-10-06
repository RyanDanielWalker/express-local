import { useEffect, useState } from 'react';
import { pickQuestions } from '../engine/questions';
import type { Question } from '../engine/types';
import { useKeys } from '../hooks/useKeys';
import { Rich } from '../components/Rich';
import { shuffle } from '../lib/random';
import { Panel } from './parts';
import type { GameProps } from './types';

/**
 * Multiple choice drill. Wrong costs a heart, and every answer shows why.
 *
 * Nothing advances on a timer. The explanation is the teaching, and the old
 * 1.5 second auto-advance meant you never read it, least of all when you were
 * right, which is exactly when it catches you being right for a bad reason.
 */
export function QuizGame({ api, line }: GameProps) {
  const [items] = useState<Question[]>(() => (line.preset ? (line.questions ?? []) : pickQuestions(line.questions ?? [], api.tier)));
  const [i, setI] = useState(0);
  const [opts, setOpts] = useState<string[]>(() => shuffle([...(items[0]?.opts ?? [])]));
  const [picked, setPicked] = useState<string | null>(null);
  const [marks, setMarks] = useState<('ok' | 'no')[]>([]);
  useEffect(() => api.say('Pick the answer you would give out loud in an interview.'), [api]);

  const q = items[i];
  const last = i + 1 >= items.length;

  function choose(o: string) {
    if (api.over || picked || !q) return;
    const ok = o === q.a;
    setPicked(o);
    setMarks(m => [...m, ok ? 'ok' : 'no']);
    api.record(q, ok);
    if (ok) api.correct(10, 'Correct. Read why before you move on.');
    else api.wrong(<>Not quite. The reason is below.</>);
    api.hold();
  }

  function next() {
    if (api.over || !picked) return;
    api.resume();
    if (last) return api.finish();
    setI(i + 1);
    setOpts(shuffle([...items[i + 1].opts]));
    setPicked(null);
  }

  // Number keys pick, space or enter moves on, so a fast run never needs the mouse.
  useKeys(e => {
    if (api.over) return;
    if (picked) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      }
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= opts.length) choose(opts[n - 1]);
  });

  if (!q) return null;

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
            {opts.map((o, k) => (
              <button
                key={o}
                disabled={!!picked}
                className={picked && o === q.a ? 'right' : picked === o ? 'wrongpick' : ''}
                onClick={() => choose(o)}
              >
                <span className="kb" aria-hidden="true">{k + 1}</span>
                <Rich text={o} />
              </button>
            ))}
          </div>
          {picked && (
            <>
              <div className="why">
                <b>{picked === q.a ? 'Right' : 'The answer is: ' + q.a}</b>
                <Rich text={q.why} />
              </div>
              <div className="decide">
                <button className="btn big" onClick={next} autoFocus>
                  {last ? 'See how you did' : 'Continue'}
                </button>
                <span className="hint" style={{ margin: 0 }}>or press space. The clock is paused.</span>
              </div>
            </>
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
