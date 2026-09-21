import { GUIDE } from '../data/guide';
import type { Line } from '../engine/types';
import { lineStyle } from './Bullet';
import { Rich } from './Rich';

export function Words({ words }: { words: [string, string][] }) {
  return (
    <dl className="words">
      {words.map(([t, d]) => (
        <div key={t} style={{ display: 'contents' }}>
          <dt>{t}</dt>
          <dd><Rich text={d} /></dd>
        </div>
      ))}
    </dl>
  );
}

export function FieldGuide({ line }: { line: Line }) {
  const g = GUIDE[line.id];
  return (
    <section className="guide" style={lineStyle(line)} aria-label="Field guide">
      <h3 className="gh">Field guide</h3>
      <div className="ggrid">
        <div className="gwide plain">
          <div className="eyebrow">In plain English</div>
          <p>{g.plain}</p>
        </div>
        <div>
          <div className="eyebrow">Words to know</div>
          <Words words={g.words} />
        </div>
        <div>
          <div className="eyebrow">Where you'll see it: {g.code.label}</div>
          <pre className="code">{g.code.snippet}</pre>
          {g.code.note && <p className="hint" style={{ margin: 0 }}>{g.code.note}</p>}
        </div>
        <div>
          <div className="eyebrow">Reach for it when</div>
          <ul className="rules">{g.when.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
        <div>
          <div className="eyebrow">Famous problems</div>
          <ul className="rules">{g.famous.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="gwide">
          <div className="eyebrow">Backstory</div>
          <p>{g.lore}</p>
        </div>
      </div>
    </section>
  );
}
