import { GUIDE } from '../data';
import type { Line } from '../engine/types';
import { lineStyle } from './Bullet';

export function Derailed({ line, onAgain, onMap }: { line: Line; onAgain: () => void; onMap: () => void }) {
  return (
    <div className="result" style={lineStyle(line)}>
      <div className="eyebrow">Out of hearts</div>
      <h2>Service suspended</h2>
      <p>Mistakes are the fastest teacher. Here's the idea to lock in before you ride again:</p>
      <div className="hook"><b>In plain English</b>{GUIDE[line.id].plain}</div>
      <div className="row">
        <button className="btn big" onClick={onAgain}>Try again</button>
        <button className="btn ghost" onClick={onMap}>Back to map</button>
      </div>
    </div>
  );
}
