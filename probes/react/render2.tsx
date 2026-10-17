import { ok, done } from './harness.ts';
import { act, memo, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const mount = async (el: any) => { const host = document.createElement('div'); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
// handler: setCount does not render on the spot
{ let renders = 0; let click!: () => void; const log: string[] = [];
  function C() { const [c, set] = useState(0); renders++; click = () => { set(c + 1); log.push('after set: renders=' + renders + ' c=' + c); }; return <p>{c}</p>; }
  const { host } = await mount(<C />); await act(async () => { click(); log.push('handler done: renders=' + renders); });
  console.log('  ', log.join(' | '), '| final renders', renders, host.textContent);
  ok(log[0] === 'after set: renders=1 c=0' && renders === 2 && host.textContent === '1', 'render happens after the handler, not inside setCount'); }
// same value: no effect runs
{ let eff = 0; let set!: (n: number) => void; function C() { const [n, s] = useState(5); set = s; useEffect(() => { eff++; }); return null; }
  await mount(<C />); const e0 = eff; await act(async () => set(6)); const e1 = eff; await act(async () => set(6)); ok(e1 === e0 + 1 && eff === e1, 'same value: no effect run'); }
// memo with no props skips parent renders
{ let n = 0; let bump!: () => void; const M = memo(function M() { n++; return null; }); function P() { const [c, s] = useState(0); bump = () => s(x => x + 1); return <>{c}<M /></>; }
  await mount(<P />); const n0 = n; await act(async () => bump()); ok(n === n0, 'memo child with no props skips'); }
// key change resets state
{ let setK!: (k: number) => void; let inc!: () => void; function Cnt() { const [c, s] = useState(0); inc = () => s(x => x + 1); return <i>{c}</i>; }
  function P() { const [k, s] = useState(1); setK = s; return <Cnt key={k} />; }
  const { host } = await mount(<P />); await act(async () => inc()); const before = host.textContent; await act(async () => setK(2)); ok(before === '1' && host.textContent === '0', 'key change resets state'); }
done();
