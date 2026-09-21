import { useEffect, useState, type KeyboardEvent } from 'react';
import { DIJ_POSITIONS as P, dijBuild, dijClosest, dijPath, dijPick, dijRelax, dijShouldUpdate, type DijState, type Edge } from '../algorithms/dijkstra';
import { letter as L } from '../lib/random';
import { useKeys } from '../hooks/useKeys';
import { CodePanel, Kbd, Panel } from './parts';
import type { GameProps } from './types';

const GOAL = P.length - 1;
const fmt = (d: number) => (d === Infinity ? '∞' : String(d));

export function DijkstraGame({ api }: GameProps) {
  const [s, setS] = useState<DijState>(() => dijBuild(api.tier));
  const [path, setPath] = useState<number[] | null>(null);
  useEffect(() => api.say('Every station starts at ∞ except A, which is 0 away from itself. Which station do you settle first?'), [api]);

  function after(next: DijState) {
    setS(next);
    if (next.phase === 'done') {
      const route = dijPath(next, GOAL);
      setPath(route);
      api.say(<>Every station settled. Cheapest route A to {L(GOAL)}: <b>{route.map(L).join(' → ')}</b>, total {next.dist[GOAL]}.</>, 'good');
      api.finish();
    }
  }

  function pick(k: number) {
    if (api.over || s.phase !== 'pick') return;
    const r = dijPick(s, k);
    if (r.reason === 'settled') return api.say(`${L(k)} is already settled. Its distance is final.`);
    if (!r.ok) {
      const best = dijClosest(s)[0];
      return api.wrong(`${L(k)} is at ${fmt(s.dist[k])}, but ${L(best)} is at ${s.dist[best]}. Always settle the closest one first.`);
    }
    api.correct(10, k === 0 ? 'A is settled at 0. Now check its neighbors.' : `${L(k)} settled at ${s.dist[k]}. Nothing can beat that now, since every other open route already costs more.`);
    after(r.state);
  }

  function relax(update: boolean) {
    if (api.over || s.phase !== 'relax') return;
    const { v, w } = s.queue[0];
    const from = s.cur!;
    const nd = s.dist[from] + w;
    if (update !== dijShouldUpdate(s)) {
      return api.wrong(update ? `${s.dist[from]} + ${w} = ${nd}, not cheaper than ${s.dist[v]}. Keep it.` : `${s.dist[from]} + ${w} = ${nd}, cheaper than ${fmt(s.dist[v])}. Update.`);
    }
    const r = dijRelax(s, update);
    api.correct(10, update ? `${L(v)} is now ${nd}, via ${L(from)}.` : `${L(v)} stays at ${s.dist[v]}. Going through ${L(from)} isn't cheaper.`);
    after(r.state);
  }

  useKeys(e => {
    if (s.phase !== 'relax') return;
    if (e.key === 'u' || e.key === 'U') relax(true);
    if (e.key === 'k' || e.key === 'K') relax(false);
  });

  const onPath = (e: Edge) => !!path && path.some((a, i) => i < path.length - 1 && ((e.u === a && e.v === path[i + 1]) || (e.v === a && e.u === path[i + 1])));
  const hot = s.phase === 'relax' ? s.queue[0]?.e : null;
  const onKey = (k: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(k);
    }
  };
  const q = s.phase === 'relax' ? s.queue[0] : null;

  return (
    <>
      <div className="board">
        <svg className="graph" viewBox="0 0 620 370" role="group" aria-label="Weighted station map">
          {s.edges.map((e, i) => {
            const [x1, y1] = P[e.u];
            const [x2, y2] = P[e.v];
            const isPrev = s.prev[e.v] === e.u || s.prev[e.u] === e.v;
            const cls = onPath(e) ? 'path' : e === hot ? 'hot' : isPrev ? 'prevE' : '';
            return (
              <g key={i}>
                <line className={`edge ${cls}`} x1={x1} y1={y1} x2={x2} y2={y2} />
                <g className="wl">
                  <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={13} />
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 1}>{e.w}</text>
                </g>
              </g>
            );
          })}
          {P.map(([x, y], k) => (
            <g
              key={k}
              className={`node ${s.settled.includes(k) ? 'on' : ''} ${k === s.cur && s.phase === 'relax' ? 'cur' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`Station ${L(k)}, distance ${fmt(s.dist[k])}`}
              onClick={() => pick(k)}
              onKeyDown={onKey(k)}
            >
              <circle cx={x} cy={y} r={24} />
              <text x={x} y={y + 1}>{L(k)}</text>
              <g className="dl">
                <rect x={x - 20} y={y - 54} width={40} height={22} rx={5} />
                <text x={x} y={y - 43}>{fmt(s.dist[k])}</text>
              </g>
            </g>
          ))}
        </svg>
        {q ? (
          <>
            <p style={{ margin: '12px 0 0' }}>
              Track <b>{L(s.cur!)} → {L(q.v)}</b> costs {q.w}. {L(s.cur!)} is {s.dist[s.cur!]} away. Update {L(q.v)}?
            </p>
            <div className="decide">
              <button className="btn" onClick={() => relax(true)}>Update {L(q.v)} to {s.dist[s.cur!] + q.w} <Kbd>U</Kbd></button>
              <button className="btn ghost" onClick={() => relax(false)}>Keep {L(q.v)} at {fmt(s.dist[q.v])} <Kbd>K</Kbd></button>
            </div>
          </>
        ) : s.phase === 'pick' ? (
          <p className="hint">Click the unsettled station with the smallest number above it.</p>
        ) : null}
      </div>
      <div className="side">
        <Panel title="Distances from A">
          {api.assist ? (
            <table className="dt">
              <thead>
                <tr><th>Stop</th><th>Dist</th><th>Via</th><th /></tr>
              </thead>
              <tbody>
                {P.map((_, k) => (
                  <tr key={k} className={s.settled.includes(k) ? 'set' : ''}>
                    <td>{L(k)}</td>
                    <td>{fmt(s.dist[k])}</td>
                    <td>{s.prev[k] == null ? '–' : L(s.prev[k]!)}</td>
                    <td>{s.settled.includes(k) ? 'settled' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ margin: 0 }}>Rush Hour: the table's gone. Read the numbers on the map, and remember which station gave each one its best route.</p>
          )}
        </Panel>
        <CodePanel
          title="The loop"
          code={`const u = closestUnvisited();
visited.add(u);
for (const {v, w} of graph[u]) {
  if (dist[u] + w < dist[v]) {
    dist[v] = dist[u] + w;
    prev[v] = u;
  }
}`}
        />
      </div>
    </>
  );
}
