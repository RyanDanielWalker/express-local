import { ok, done } from './harness.ts';
import { act, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const mount = async (el: any) => { const host = document.createElement('div'); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// timing: effect after commit
{ const log: string[] = []; function C() { log.push('render'); useEffect(() => { log.push('effect sees DOM text: ' + document.getElementById('t')?.textContent); }); return <p id="t">hi</p>; }
  const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => root.render(<C />));
  ok(log.join('|') === 'render|effect sees DOM text: hi', 'effect runs after the DOM is committed'); }
// no deps vs [] 
{ let a = 0, b = 0; let bump!: () => void; function C() { const [n, s] = useState(0); bump = () => s(x => x + 1); useEffect(() => { a++; }); useEffect(() => { b++; }, []); return <i>{n}</i>; }
  await mount(<C />); await act(async () => bump()); await act(async () => bump()); ok(a === 3 && b === 1, 'no array: every render; []: once'); }
// StrictMode: mount, cleanup, mount
{ const log: string[] = []; function C() { useEffect(() => { log.push('effect'); return () => log.push('cleanup'); }, []); return null; }
  const { root } = await mount(<StrictMode><C /></StrictMode>); ok(log.join('|') === 'effect|cleanup|effect', 'StrictMode: effect, cleanup, effect'); await act(async () => root.unmount()); ok(log.at(-1) === 'cleanup', 'cleanup on unmount'); }
// prop change order: render with new, cleanup old, effect new
{ const log: string[] = []; let setRoom!: (r: string) => void;
  function Chat({ roomId }: { roomId: string }) { log.push('render ' + roomId); useEffect(() => { log.push('connect ' + roomId); return () => log.push('disconnect ' + roomId); }, [roomId]); return null; }
  function App() { const [r, s] = useState('general'); setRoom = s; return <Chat roomId={r} />; }
  await mount(<App />); log.length = 0; await act(async () => setRoom('travel'));
  console.log('  ', log.join(' > ')); ok(log.join('|') === 'render travel|disconnect general|connect travel', 'new render, then old cleanup, then new effect'); }
// derived state via effect renders twice
{ let renders = 0; function C({ first, last }: { first: string; last: string }) { const [full, setFull] = useState(''); renders++; useEffect(() => { setFull(first + ' ' + last); }, [first, last]); return <i>{full}</i>; }
  const { host } = await mount(<C first="Ada" last="L" />); ok(renders === 2 && host.textContent === 'Ada L', 'state + effect: two renders for one value'); }
// loop: object state in its own deps
{ let runs = 0; const errs: any[] = []; const oe = console.error; console.error = (...a: any[]) => errs.push(String(a[0]).slice(0, 80));
  function C() { const [u, setU] = useState({ n: 0 }); useEffect(() => { runs++; if (runs < 200) setU({ n: 1 }); }, [u]); return null; }
  await mount(<C />); await sleep(50); console.error = oe; console.log('   loop runs', runs, 'errors', errs.length, errs[0] ?? '');
  ok(runs >= 50, 'object state in its own deps keeps re-running'); }
// interval stale closure
{ const seen: number[] = []; let setC!: (n: number) => void;
  function C() { const [count, s] = useState(0); setC = s; useEffect(() => { const id = setInterval(() => seen.push(count), 10); return () => clearInterval(id); }, []); return null; }
  const { root } = await mount(<C />); await act(async () => setC(5)); await sleep(45); await act(async () => root.unmount());
  ok(seen.length > 1 && seen.every(x => x === 0), 'interval keeps logging the first count'); }
// race: older response lands after newer, without cleanup
{ let setId!: (n: number) => void; function C() { const [id, s] = useState(1); const [name, setName] = useState(''); setId = s;
    useEffect(() => { const delay = id === 1 ? 40 : 5; setTimeout(() => setName('user' + id), delay); }, [id]); return <i>{name}</i>; }
  const { host } = await mount(<C />); await act(async () => setId(2)); await act(async () => { await sleep(60); });
  ok(host.textContent === 'user1', 'without cleanup, the older slow response wins'); }
{ let setId!: (n: number) => void; function C() { const [id, s] = useState(1); const [name, setName] = useState(''); setId = s;
    useEffect(() => { let ignore = false; const delay = id === 1 ? 40 : 5; setTimeout(() => { if (!ignore) setName('user' + id); }, delay); return () => { ignore = true; }; }, [id]); return <i>{name}</i>; }
  const { host } = await mount(<C />); await act(async () => setId(2)); await act(async () => { await sleep(60); });
  ok(host.textContent === 'user2', 'with an ignore flag in cleanup, the newest wins'); }
// async effect: runtime warning
{ const errs: string[] = []; const oe = console.error; console.error = (...a: any[]) => errs.push(a.join(' ').slice(0, 160));
  function C() { useEffect((async () => { await 0; }) as any, []); return null; } const { root } = await mount(<C />); await act(async () => root.unmount()); console.error = oe;
  console.log('   async effect dev error:', errs[0]); ok(errs.length > 0, 'async effect warns in development'); }
done();
