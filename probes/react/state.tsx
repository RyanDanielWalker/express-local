import { ok, done } from './harness.ts';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const mount = async (el: any) => { const host = document.createElement('div'); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// batching in a timeout
{ let r = 0; let go!: () => void; function C() { const [a, sa] = useState(0); const [b, sb] = useState(0); r++; go = () => setTimeout(() => { sa(1); sb(2); }, 0); return <i>{a}{b}</i>; }
  await mount(<C />); const r0 = r; await act(async () => { go(); await sleep(10); }); ok(r - r0 === 1, 'two setters in a timeout: one render'); }
// log right after set
{ let logged: any; let click!: () => void; function C() { const [count, set] = useState(0); click = () => { set(5); logged = count; }; return null; }
  await mount(<C />); await act(async () => click()); ok(logged === 0, 'logging after set shows the old value'); }
// flow: set(count+1) then updater
{ let click!: () => void; let renders = 0; function C() { const [count, set] = useState(0); renders++; click = () => { set(count + 1); set(c => c + 1); }; return <i>{count}</i>; }
  const { host } = await mount(<C />); const r0 = renders; await act(async () => click()); ok(host.textContent === '2' && renders - r0 === 1, 'set(count+1) then updater gives 2, one render'); }
// count+1 twice -> 1, updater twice -> 2
{ let a!: () => void, b!: () => void; function C() { const [c, set] = useState(0); a = () => { set(c + 1); set(c + 1); }; b = () => { set(x => x + 1); set(x => x + 1); }; return <i>{c}</i>; }
  const { host } = await mount(<C />); await act(async () => a()); const after1 = host.textContent; await act(async () => b()); ok(after1 === '1' && host.textContent === '3', 'plain twice adds 1, updater twice adds 2'); }
// push sets a number
{ let add!: () => void; function C() { const [todos, setTodos] = useState<any>(['a']); add = () => setTodos(todos.push('b')); return <i>{JSON.stringify(todos)}</i>; }
  const { host } = await mount(<C />); await act(async () => add()); ok(host.textContent === '2', 'setTodos(todos.push(item)) stores the new length'); }
{ let add!: () => void; let r = 0; function C() { const [todos, setTodos] = useState(['a']); r++; add = () => { todos.push('b'); setTodos(todos); }; return <i>{todos.length}</i>; }
  const { host } = await mount(<C />); const r0 = r; await act(async () => add()); ok(r === r0 && host.textContent === '1', 'push then same array: no re-render, screen stale'); }
// two instances
{ let inc!: () => void; let first = true; function Counter() { const [c, s] = useState(0); if (first) { inc = () => s(x => x + 1); first = false; } return <i>{c}</i>; }
  const { host } = await mount(<><Counter /><Counter /></>); await act(async () => inc()); ok(host.textContent === '10', 'two Counters keep separate state'); }
// lazy init
{ let calls = 0; const build = () => { calls++; return [1]; }; let bump!: () => void;
  function A() { const [l] = useState(build()); const [n, s] = useState(0); bump = () => s(x => x + 1); return <i>{l.length}{n}</i>; }
  await mount(<A />); await act(async () => bump()); await act(async () => bump()); const eager = calls; calls = 0;
  function B() { const [l] = useState(build); const [n, s] = useState(0); bump = () => s(x => x + 1); return <i>{l.length}{n}</i>; }
  await mount(<B />); await act(async () => bump()); await act(async () => bump()); ok(eager === 3 && calls === 1, 'useState(fn()) runs every render, useState(fn) once'); }
// mutation + same object
{ let go!: () => void; let r = 0; function C() { const [u, set] = useState({ name: 'A' }); r++; go = () => { u.name = 'Ryan'; set(u); }; return <i>{u.name}</i>; }
  const { host } = await mount(<C />); const r0 = r; await act(async () => go()); ok(r === r0 && host.textContent === 'A', 'mutating and passing the same object: no render'); }
done();
