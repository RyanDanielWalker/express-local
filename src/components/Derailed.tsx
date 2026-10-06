import { GUIDE } from '../data';
import type { Line, Question } from '../engine/types';
import { lineStyle } from './Bullet';
import { Rich } from './Rich';

interface Props {
  line: Line;
  /** Questions missed during the run, shown so the ending is still a study moment. */
  missed?: Question[];
  onAgain: () => void;
  onMap: () => void;
}

export function Derailed({ line, missed = [], onAgain, onMap }: Props) {
  return (
    <div className="result" style={lineStyle(line)}>
      <div className="eyebrow">Out of hearts</div>
      <h2>Service suspended</h2>
      <p>Mistakes are the fastest teacher. Here's the idea to lock in before you ride again:</p>
      {GUIDE[line.id] && <div className="hook"><b>In plain English</b>{GUIDE[line.id].plain}</div>}
      {missed.length > 0 && (
        <div>
          <div className="eyebrow">What you missed</div>
          <ol className="recap">
            {missed.map((q, i) => (
              <li key={i}>
                <p className="rq"><Rich text={q.q} /></p>
                <p className="ra"><b>{q.a}</b></p>
                <p className="rw"><Rich text={q.why} /></p>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="row">
        <button className="btn big" onClick={onAgain}>Try again</button>
        <button className="btn ghost" onClick={onMap}>Back to map</button>
      </div>
    </div>
  );
}
