import { useEffect, useState } from 'react';
import { hashOf, lookup } from '../algorithms/searching';
import { range, rnd, shuffle } from '../lib/random';
import { useTimers } from '../hooks/useTimers';
import { CodePanel, Panel, plural } from './parts';
import type { GameProps } from './types';

interface Op {
  op: 'insert' | 'has';
  k: number;
}
interface Lit {
  b: number;
  upto: number;
  hit?: number;
}

const SIZES = [[], [10, 7], [7, 11], [11, 13]];
const KEYS = [0, 6, 7, 8];

/** Keys guaranteed to collide at least twice, then three lookups: two hits and one miss that lands in a busy bucket. */
function buildRound(m: number, count: number): Op[] {
  let keys: number[];
  do keys = shuffle(range(10, 98)).slice(0, count);
  while (new Set(keys.map(x => hashOf(x, m))).size > count - 2);
  const counts: Record<number, number> = {};
  keys.forEach(x => (counts[hashOf(x, m)] = (counts[hashOf(x, m)] ?? 0) + 1));
  const crowded = keys.filter(x => counts[hashOf(x, m)] > 1);
  const hitKey = crowded[crowded.length - 1];
  const other = keys.find(x => x !== hitKey)!;
  let miss: number;
  do miss = rnd(10, 99);
  while (keys.includes(miss) || !counts[hashOf(miss, m)]);
  return [...keys.map((k): Op => ({ op: 'insert', k })), ...shuffle<Op>([{ op: 'has', k: hitKey }, { op: 'has', k: other }, { op: 'has', k: miss }])];
}

export function HashTableGame({ api }: GameProps) {
  const later = useTimers();
  const sizes = SIZES[api.tier];
  const [round, setRound] = useState(0);
  const m = sizes[round];
  const [ops, setOps] = useState(() => buildRound(sizes[0], KEYS[api.tier]));
  const [oi, setOi] = useState(0);
  const [table, setTable] = useState<number[][]>(() => range(0, sizes[0] - 1).map(() => []));
  const [lit, setLit] = useState<Lit | null>(null);
  useEffect(() => api.say(<>Table 1 of {sizes.length}: {sizes[0]} buckets. Where does <b>{ops[0].k}</b> go?</>), [api]);

  function pick(b: number) {
    if (api.over || oi >= ops.length) return;
    const o = ops[oi];
    const want = hashOf(o.k, m);
    if (b !== want) return api.wrong(<>Not {b}. {o.k} % {m}: {o.k} = {Math.floor(o.k / m)} × {m} + <b>{want}</b>, so the remainder is {want}.</>);
    const bucket = table[b];
    if (o.op === 'insert') {
      const nextBucket = [...bucket, o.k];
      setTable(table.map((c, i) => (i === b ? nextBucket : c)));
      setLit({ b, upto: -1 });
      api.correct(10, nextBucket.length > 1 ? `Collision! ${o.k} joins ${bucket.join(', ')} in bucket ${b}. They share a list.` : `${o.k} % ${m} = ${b}. Stored.`);
    } else {
      const { found, comparisons } = lookup(bucket, o.k);
      setLit({ b, upto: comparisons - 1, hit: o.k });
      api.correct(
        15,
        found
          ? `Bucket ${b} holds [${bucket.join(', ')}]. Found ${o.k} after ${plural(comparisons, 'comparison')}. Every other bucket got skipped.`
          : `Bucket ${b} holds [${bucket.join(', ')}], no ${o.k}. So it's not in the table at all. Returned false after ${plural(comparisons, 'comparison')}.`,
      );
    }
    const n = oi + 1;
    setOi(n);
    if (n >= ops.length) {
      if (round + 1 >= sizes.length) return api.finish();
      return later(() => {
        const nm = sizes[round + 1];
        const nextOps = buildRound(nm, KEYS[api.tier]);
        setRound(round + 1);
        setOps(nextOps);
        setOi(0);
        setTable(range(0, nm - 1).map(() => []));
        setLit(null);
        api.say(<>Table {round + 2} of {sizes.length}: {nm} buckets. Where does <b>{nextOps[0].k}</b> go?</>);
      }, 2400);
    }
    if (ops[n].op === 'has' && o.op === 'insert') later(() => !api.over && api.say(<>All stored. Now look some up. Which bucket would <b>{ops[n].k}</b> be in?</>), 1400);
  }

  const o = ops[oi];
  const filled = table.filter(c => c.length).length;
  const collisions = table.reduce((a, c) => a + Math.max(0, c.length - 1), 0);
  return (
    <>
      <div className="board">
        <div className="eyebrow">hash(key) = key % {m}</div>
        <div className="op">{o ? <>table.{o.op}({o.k}) <span className="qm">bucket?</span></> : 'Done'}</div>
        <div className="buckets" style={{ ['--m' as string]: m }}>
          {table.map((chain, i) => (
            <div className="bucket" key={i}>
              <button className={lit?.b === i ? 'lit' : ''} aria-label={`bucket ${i}`} onClick={() => pick(i)}>{i}</button>
              {chain.map((x, j) => (
                <span key={x} className={`k ${lit?.b === i && j <= lit.upto ? (x === lit.hit ? 'hit' : 'scan') : ''}`}>{x}</span>
              ))}
            </div>
          ))}
        </div>
        <p className="hint">Stuck? Divide by {m} and keep the remainder.{m === 10 ? " With 10 buckets that's just the last digit." : ''}</p>
      </div>
      <div className="side">
        <CodePanel
          title="The code"
          code={`const b = key % ${m};
table[b].push(key);         // insert
table[b].includes(key);     // has`}
        />
        <Panel title="Table stats">
          <div className="mono" style={{ lineHeight: 1.8 }}>buckets used = {filled} / {m}<br />collisions = {collisions}</div>
        </Panel>
        <Panel title="Why it's fast">
          <p style={{ margin: 0 }}>A lookup only scans one bucket. The other {m - 1} never get looked at, no matter how big the table grows.</p>
        </Panel>
      </div>
    </>
  );
}
