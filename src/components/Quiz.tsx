import { useState } from 'react';
import { Rich } from './Rich';
import type { Line, QuizQuestion } from '../engine/types';
import { shuffle } from '../lib/random';
import { useTimers } from '../hooks/useTimers';
import { lineStyle } from './Bullet';

/** Remember the last question per line so a replay never repeats it back to back. */
const lastAsked: Partial<Record<string, QuizQuestion>> = {};

export function Quiz({ line, onDone }: { line: Line; onDone: (correct: boolean) => void }) {
  const later = useTimers();
  const [{ q, opts }] = useState(() => {
    const pool = (line.quiz ?? []).filter(x => x !== lastAsked[line.id]);
    const q = pool[Math.floor(Math.random() * pool.length)];
    lastAsked[line.id] = q;
    return { q, opts: shuffle([...q.opts]) };
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [before, after] = q.code.split('___');

  function choose(o: string) {
    if (picked) return;
    setPicked(o);
    later(() => onDone(o === q.a), 2200);
  }

  return (
    <div className="qwrap" style={lineStyle(line)}>
      <div className="eyebrow">Last stop · fill the gap</div>
      <h2 style={{ fontFamily: 'var(--display)', fontWeight: 900, textTransform: 'uppercase', fontSize: 34, margin: 0 }}>What goes in the blank?</h2>
      <pre className="code">{before}<span className="blank">___</span>{after}</pre>
      <div className="opts">
        {opts.map(o => (
          <button key={o} disabled={!!picked} className={picked && o === q.a ? 'right' : picked === o ? 'wrongpick' : ''} onClick={() => choose(o)}>{o}</button>
        ))}
      </div>
      {picked && (
        <p className="hint">
          {picked === q.a ? <b>Right. </b> : <b>It's <code>{q.a}</code>. </b>}
          <Rich text={q.why} />
        </p>
      )}
    </div>
  );
}
