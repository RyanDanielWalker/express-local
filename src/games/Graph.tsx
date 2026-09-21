import { useEffect, useState, type KeyboardEvent } from 'react';
import { makeGraph, traverse, type Graph, type Traversal } from '../algorithms/graph';
import { letter as L } from '../lib/random';
import { useTimers } from '../hooks/useTimers';
import { CodePanel, Mono, Panel } from './parts';
import type { GameProps } from './types';

const ROUNDS = 2;

export function GraphGame({ api, kind }: GameProps & { kind: 'bfs' | 'dfs' }) {
  const later = useTimers();
  const isB = kind === 'bfs';
  const build = () => {
    const g = makeGraph(api.tier);
    return { g, sim: traverse(g.adj, kind) };
  };
  const [round, setRound] = useState(0);
  const [{ g, sim }, setBoard] = useState<{ g: Graph; sim: Traversal }>(build);
  useEffect(() => api.say(<>Graph 1 of {ROUNDS}. Start at <b>A</b>.</>), [api]);
  const [idx, setIdx] = useState(0);
  const [pulse, setPulse] = useState<number | null>(null);

  function pick(i: number) {
    if (api.over || idx >= sim.order.length) return;
    const want = sim.order[idx];
    const pos = sim.order.indexOf(i);
    if (pos > -1 && pos < idx) return api.say(`${L(i)} is already visited. Where does the train go next?`);
    if (i !== want) {
      const why =
        idx === 0 ? 'Every trip starts at A.'
        : isB ? <>The queue's <b>front</b> is {L(want)}. BFS always takes the oldest waiting station.</>
        : <>The stack's <b>top</b> is {L(want)}. DFS always takes the newest pushed station.</>;
      api.wrong(<>Not {L(i)}. {why}</>);
      setPulse(want);
      return;
    }
    setPulse(null);
    const n = idx + 1;
    setIdx(n);
    const done = n === sim.order.length;
    const par = sim.parent[i];
    api.correct(
      10,
      done ? <>All stations visited. Order: <Mono>{sim.order.map(L).join(' → ')}</Mono></>
      : par == null ? `Departing A. Its neighbors go on the ${isB ? 'queue' : 'stack'}.`
      : `${L(i)} reached from ${L(par)}.`,
    );
    if (!done) return;
    if (round + 1 < ROUNDS) {
      later(() => {
        setRound(round + 1);
        setBoard(build());
        setIdx(0);
        api.say(<>Graph {round + 2} of {ROUNDS}. Start at <b>A</b>.</>);
      }, 1600);
    } else api.finish();
  }

  const visited = new Set(sim.order.slice(0, idx));
  const N = g.nodes;
  const edges: [number, number][] = [];
  g.adj.forEach((ns, a) => ns.forEach(b => a < b && edges.push([a, b])));
  const cur = idx === 0 ? [{ n: 0 }] : sim.snaps[idx - 1];
  const onKey = (i: number) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(i);
    }
  };

  return (
    <>
      <div className="board">
        <svg className="graph" viewBox="0 0 600 380" role="group" aria-label="Station graph">
          {edges.map(([a, b]) => {
            const tree = visited.has(a) && visited.has(b) && (sim.parent[b] === a || sim.parent[a] === b);
            return <line key={`${a}-${b}`} className={`edge ${tree ? 'tree' : ''}`} x1={N[a].x} y1={N[a].y} x2={N[b].x} y2={N[b].y} />;
          })}
          {N.map((nd, i) => {
            const k = sim.order.indexOf(i);
            const on = k > -1 && k < idx;
            return (
              <g key={i} className={`node ${on ? 'on' : ''} ${pulse === i ? 'pulse' : ''}`} tabIndex={0} role="button" aria-label={`Station ${L(i)}`} onClick={() => pick(i)} onKeyDown={onKey(i)}>
                <circle cx={nd.x} cy={nd.y} r={24} />
                <text x={nd.x} y={nd.y + 1}>{L(i)}</text>
                {on && (
                  <g className="badge">
                    <circle cx={nd.x + 22} cy={nd.y - 20} r={11} />
                    <text x={nd.x + 22} y={nd.y - 20}>{k + 1}</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        <p className="hint">Visit order so far: <Mono>{sim.order.slice(0, idx).map(L).join(' → ') || '(none yet)'}</Mono></p>
      </div>
      <div className="side">
        <Panel title={isB ? 'Queue' : 'Stack'}>
          {api.assist ? (
            <>
              <div className="chips">
                <span className="bracket">[</span>
                {cur.map((e, i) => (
                  <span key={i} className={`chip ${'skip' in e && e.skip ? 'skip' : ''}`}>{L(e.n)}</span>
                ))}
                <span className="bracket">]</span>
              </div>
              <div className="ends">
                <span>{isB ? 'front · shift()' : 'bottom'}</span>
                <span>{isB ? 'back · push()' : 'top · pop()'}</span>
              </div>
            </>
          ) : (
            <p style={{ margin: 0 }}>Rush Hour: no peeking. Keep the {isB ? 'queue' : 'stack'} in your head. That's the exact skill a whiteboard interview tests.</p>
          )}
        </Panel>
        <CodePanel
          title="The loop"
          code={`while (${isB ? 'queue' : 'stack'}.length) {
  const node = ${isB ? 'queue.shift()' : 'stack.pop()'};${isB ? '' : '\n  if (seen.has(node)) continue;'}
  visit(node);
  for (const nb of graph[node]) ...
}`}
        />
        <Panel title="Neighbors of each station">
          <div className="mono" style={{ fontSize: 13, lineHeight: 1.7 }}>
            {g.adj.map((ns, i) => (
              <div key={i}>{L(i)}: {ns.map(L).join(', ')}</div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
