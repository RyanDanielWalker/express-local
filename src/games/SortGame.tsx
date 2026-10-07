import { useEffect, useState } from 'react';
import { revealAfterMiss } from '../engine/questions';
import type { Sort } from '../engine/types';
import { useKeys } from '../hooks/useKeys';
import { Rich } from '../components/Rich';
import { shuffle } from '../lib/random';
import { Panel } from './parts';
import type { GameProps } from './types';

/**
 * Put each item in the bucket it belongs to. Pick a card, then a box.
 *
 * A right drop explains itself in the status line, since that is the moment
 * the connection is made. A wrong drop only says it was wrong, same as the
 * flow game: which box it really goes in is the thing being drilled.
 */
export function SortGame({ api, sort, role }: GameProps & { sort: Sort }) {
  const [items] = useState(() => shuffle([...sort.items]));
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(items[0]?.name ?? null);
  const [misses, setMisses] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  useEffect(() => api.say('Pick a card, then the box it belongs in.'), [api]);

  const left = items.filter(i => !placed[i.name]);
  const item = items.find(i => i.name === selected);

  function drop(bucket: string) {
    if (api.over || done || !item) return;
    if (item.bucket !== bucket) {
      const n = (misses[item.name] ?? 0) + 1;
      setMisses(m => ({ ...m, [item.name]: n }));
      return api.wrong(
        revealAfterMiss(api.tier, n)
          ? <>Not that one. It goes in <b>{item.bucket}</b>.</>
          : 'Not that one.',
      );
    }
    const next = { ...placed, [item.name]: bucket };
    setPlaced(next);
    api.correct(8, <><b>{bucket}.</b> <Rich text={item.why} /></>);
    const remaining = items.filter(i => !next[i.name]);
    setSelected(remaining[0]?.name ?? null);
    if (remaining.length) return;
    setDone(true);
    api.say('All sorted. Read the note, then carry on.', 'good');
    api.hold();
  }

  function next() {
    if (api.over || !done) return;
    api.resume();
    api.finish();
  }

  useKeys(e => {
    if (api.over) return;
    if (done) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      }
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= sort.buckets.length) drop(sort.buckets[n - 1]);
  });

  const fumbled = items.filter(i => misses[i.name]);

  return (
    <>
      <div className="board">
        <div className="qcard sort">
          <div className="eyebrow">{role === 'finale' ? 'Last stop' : 'Sort it out'}</div>
          <p className="scenario"><Rich text={sort.title} /></p>

          <div className="buckets">
            {sort.buckets.map((b, k) => (
              <button key={b} className={`bucket ${item && !done ? 'armed' : ''}`} onClick={() => drop(b)} disabled={done}>
                <span className="bh"><span className="kb" aria-hidden="true">{k + 1}</span>{b}</span>
                <span className="chips">
                  {items.filter(i => placed[i.name] === b).map(i => <span key={i.name} className="sorted">{i.name}</span>)}
                </span>
              </button>
            ))}
          </div>

          {!done && (
            <div className="tray" aria-label="Cards left to sort">
              {left.map(i => (
                <button key={i.name} className={i.name === selected ? 'sel' : ''} aria-pressed={i.name === selected} onClick={() => setSelected(i.name)}>
                  {i.name}
                </button>
              ))}
            </div>
          )}

          {done && (
            <div className="why">
              <b>The idea</b>
              <Rich text={sort.note} />
              {fumbled.length > 0 && (
                <ul className="fumbles">
                  {fumbled.map(i => (
                    <li key={i.name}><em>{i.name}</em> goes in {i.bucket}. <Rich text={i.why} /></li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {done && (
            <div className="decide">
              <button className="btn big" onClick={next} autoFocus>See how you did</button>
              <span className="hint" style={{ margin: 0 }}>or press space. The clock is paused.</span>
            </div>
          )}
        </div>
      </div>
      <div className="side">
        {api.assist && (
          <Panel title="How to play">
            <p style={{ margin: 0 }}>The highlighted card is the one you are placing. Click a box, or press its number. Click any other card to switch.</p>
          </Panel>
        )}
      </div>
    </>
  );
}
