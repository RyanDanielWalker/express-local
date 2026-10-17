import { ok, done } from './harness.ts';
import { act, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const mount = async (el: any) => { const host = document.createElement('div'); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
// filter makes a new array: memo child re-renders
{ let n = 0; let bump!: () => void; const Child = memo(function Child({ items }: { items: number[] }) { n++; return null; });
  function P() { const [c, s] = useState(0); bump = () => s(x => x + 1); const data = [1, 2, 3]; const items = data.filter(x => x > 1); return <>{c}<Child items={items} /></>; }
  await mount(<P />); const n0 = n; await act(async () => bump()); ok(n === n0 + 1, 'filtered array prop defeats memo'); }
// useMemo recompute only when dep changes
{ let calls = 0; let bump!: () => void; let setItems!: (x: number[]) => void;
  function C() { const [c, s] = useState(0); const [items, si] = useState([1]); bump = () => s(x => x + 1); setItems = si; const sum = useMemo(() => { calls++; return items.reduce((a, b) => a + b, 0); }, [items]); return <i>{sum}{c}</i>; }
  await mount(<C />); await act(async () => bump()); await act(async () => bump()); const c1 = calls; await act(async () => setItems([1, 2])); ok(c1 === 1 && calls === 2, 'useMemo runs again only when items changes'); }
// useCallback with [] sees first count
{ let cb: any; let inc!: () => void; function C() { const [count, s] = useState(0); inc = () => s(x => x + 1); cb = useCallback(() => count, []); return null; }
  await mount(<C />); await act(async () => inc()); await act(async () => inc()); ok(cb() === 0, 'useCallback with [] keeps the first count'); }
// string prop keeps identity, inline arrow does not
{ let a = 0, b = 0; let bump!: () => void; const S = memo(function S({ v }: { v: string }) { a++; return null; }); const F = memo(function F({ f }: { f: () => void }) { b++; return null; });
  function P() { const [c, s] = useState(0); bump = () => s(x => x + 1); return <>{c}<S v="primary" /><F f={() => {}} /></>; }
  await mount(<P />); await act(async () => bump()); ok(a === 1 && b === 2, 'string prop skips, inline arrow re-renders'); }
// useCallback keeps function stable for an effect dep
{ let effects = 0; let bump!: () => void; function C() { const [c, s] = useState(0); bump = () => s(x => x + 1); const f = useCallback(() => {}, []); useEffect(() => { effects++; }, [f]); return <i>{c}</i>; }
  await mount(<C />); await act(async () => bump()); ok(effects === 1, 'stable callback: effect does not re-run'); }
// memo with stable useCallback prop skips
{ let n = 0; let bump!: () => void; const Row = memo(function Row({ onSelect }: { onSelect: (id: number) => void }) { n++; return null; });
  function L() { const [c, s] = useState(0); bump = () => s(x => x + 1); const onSelect = useCallback((id: number) => {}, []); return <>{c}<Row onSelect={onSelect} /></>; }
  await mount(<L />); await act(async () => bump()); ok(n === 1, 'useCallback prop lets memo skip'); }
done();
