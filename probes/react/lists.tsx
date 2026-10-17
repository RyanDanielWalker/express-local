import { ok, done } from './harness.ts';
import { act, Fragment, useState } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const errs: string[] = []; const oe = console.error; console.error = (...a: any[]) => errs.push(a.map(String).join(' ').replace(/\s+/g, ' ').slice(0, 120));
const mount = async (el: any) => { const host = document.createElement('div'); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
// no key: warns, works
{ errs.length = 0; const { host } = await mount(<ul>{['a', 'b'].map(x => <li>{x}</li>)}</ul>); ok(host.textContent === 'ab' && errs.some(e => /unique "key"/.test(e)), 'no key: renders and warns'); }
// props.key
{ errs.length = 0; let seen: any = 'x'; function Row(p: any) { seen = p.key; return null; } await mount(<Row key="k1" />); console.log('   props.key =', seen, '| warning:', errs[0]?.slice(0, 80)); ok(seen === undefined, 'key is not passed as a prop'); }
// duplicate keys
{ errs.length = 0; const { host } = await mount(<ul>{['a', 'b'].map(x => <li key="same">{x}</li>)}</ul>); console.log('   dup render:', host.textContent, '|', errs[0]?.slice(0, 90)); ok(errs.some(e => /same key/.test(e)), 'duplicate keys warn'); }
// reverse with id keys moves nodes
{ let set!: (x: string[]) => void; function L() { const [xs, s] = useState(['a', 'b', 'c']); set = s; return <ul>{xs.map(x => <li key={x}>{x}</li>)}</ul>; }
  const { host } = await mount(<L />); const before = [...host.querySelectorAll('li')]; await act(async () => set(['c', 'b', 'a'])); const after = [...host.querySelectorAll('li')];
  ok(after[0] === before[2] && after[2] === before[0] && after[0].textContent === 'c', 'id keys: same DOM nodes moved'); }
{ let set!: (x: string[]) => void; function L() { const [xs, s] = useState(['a', 'b', 'c']); set = s; return <ul>{xs.map((x, i) => <li key={i}>{x}</li>)}</ul>; }
  const { host } = await mount(<L />); const before = [...host.querySelectorAll('li')]; await act(async () => set(['c', 'b', 'a'])); const after = [...host.querySelectorAll('li')];
  ok(after[0] === before[0] && after[0].textContent === 'c', 'index keys: nodes stay put, text updated in place'); }
// delete first row with index keys: typed text stays on row 0
{ let del!: () => void; function L() { const [xs, s] = useState(['A', 'B', 'C']); del = () => s(v => v.slice(1)); return <div>{xs.map((x, i) => <label key={i}>{x}<input /></label>)}</div>; }
  const { host } = await mount(<L />); const inp = host.querySelector('input')! as any; inp.value = 'typed for A';
  await act(async () => del()); const first = host.querySelector('label')!; console.log('   row0 label:', first.firstChild?.textContent, 'input:', (first.querySelector('input') as any).value, 'rows:', host.querySelectorAll('label').length);
  ok(first.firstChild?.textContent === 'B' && (first.querySelector('input') as any).value === 'typed for A', 'index keys: typed text stays on row 0, now labeled B'); }
{ let del!: () => void; function L() { const [xs, s] = useState(['A', 'B', 'C']); del = () => s(v => v.slice(1)); return <div>{xs.map(x => <label key={x}>{x}<input /></label>)}</div>; }
  const { host } = await mount(<L />); (host.querySelector('input') as any).value = 'typed for A'; await act(async () => del());
  ok((host.querySelector('input') as any).value === '', 'id keys: A row removed with its text'); }
// fragment with key
{ const { host } = await mount(<dl>{[['t', 'd']].map(([a, b]) => <Fragment key={a}><dt>{a}</dt><dd>{b}</dd></Fragment>)}</dl>); ok(host.innerHTML === '<dl><dt>t</dt><dd>d</dd></dl>', 'Fragment key works'); }
// key change remounts
{ let setK!: (k: string) => void; let mounts = 0; function C() { useState(() => { mounts++; return 0; }); return null; } function P() { const [k, s] = useState('a'); setK = s; return <C key={k} />; }
  await mount(<P />); await act(async () => setK('b')); ok(mounts === 2, 'key change remounts'); }
// type swap at same position drops state
{ let swap!: () => void; let inc!: () => void; function A() { const [c, s] = useState(0); inc = () => s(1); return <i>{c}</i>; } function B() { const [c] = useState(0); return <b>{c}</b>; }
  function P() { const [t, s] = useState(true); swap = () => s(x => !x); return t ? <A /> : <B />; }
  const { host } = await mount(<P />); await act(async () => inc()); await act(async () => swap()); await act(async () => swap()); ok(host.textContent === '0', 'different type at same position: state reset'); }
// Math.random key remounts every render
{ let mounts = 0; let bump!: () => void; function R() { useState(() => { mounts++; return 0; }); return null; } function P() { const [n, s] = useState(0); bump = () => s(x => x + 1); return <>{[1, 2].map(i => <R key={Math.random()} />)}</>; }
  await mount(<P />); await act(async () => bump()); ok(mounts === 4, 'random keys remount every row each render'); }
console.error = oe; done();
