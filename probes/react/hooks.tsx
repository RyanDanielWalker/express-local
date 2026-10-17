import { ok, done } from './harness.ts';
import { act, createContext, use, useActionState, useContext, useEffect, useOptimistic, useState, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const errs: string[] = []; const oe = console.error; console.error = (...a: any[]) => errs.push(a.map(String).join(' ').replace(/\s+/g, ' ').slice(0, 140));
const mount = async (el: any) => { const host = document.createElement('div'); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
// conditional hook: flow
{ let flip!: () => void; const seen: string[] = []; let thrown = '';
  function Profile({ isAdmin }: { isAdmin: boolean }) { if (isAdmin) { const [name] = useState('Ada'); } const [age] = useState(30); seen.push(String(age)); return null; }
  function App() { const [a, s] = useState(true); flip = () => s(false); return <Profile isAdmin={a} />; }
  class B extends (await import('react')).Component<any, any> { state = { e: '' }; static getDerivedStateFromError(e: any) { return { e: e.message }; } render() { if (this.state.e) { thrown = this.state.e; return null; } return this.props.children; } }
  await mount(<B><App /></B>); await act(async () => flip());
  console.log('   age values seen:', seen.join(','), '| thrown:', thrown.slice(0, 90));
  ok(seen.includes('Ada') && /fewer hooks/.test(thrown), 'conditional hook: age reads the name slot, then React throws'); }
// hook in handler
{ let click!: () => void; let msg = ''; function C() { click = () => { try { (useState as any)(0); } catch (e: any) { msg = e.message; } }; return null; }
  await mount(<C />); await act(async () => click()); console.log('   handler hook:', msg.slice(0, 80)); ok(/Invalid hook call|hooks/i.test(msg), 'hook in a handler throws'); }
// custom hook: two listeners
{ let adds = 0; const orig = window.addEventListener.bind(window); (window as any).addEventListener = (t: string, ...r: any[]) => { if (t === 'resize') adds++; return (orig as any)(t, ...r); };
  function useWindowWidth() { const [w, s] = useState(0); useEffect(() => { const h = () => s(1); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []); return w; }
  function Header() { useWindowWidth(); return null; } function Sidebar() { useWindowWidth(); return null; }
  await mount(<><Header /><Sidebar /></>); ok(adds === 2, 'two callers, two listeners'); }
// prefix not needed at runtime
{ function getCount() { const [c] = useState(7); return c; } function C() { return <i>{getCount()}</i>; } const { host } = await mount(<C />); ok(host.textContent === '7', 'hook without use prefix still runs'); }
// use(Context) in an if, and Context as provider, and default without provider
{ const Theme = createContext('light'); function C({ show }: { show: boolean }) { let t = 'none'; if (show) { t = use(Theme); } return <i>{t}</i>; }
  const { host } = await mount(<Theme value="dark"><C show={true} /></Theme>); ok(host.textContent === 'dark', 'use(Context) inside if works, <Context value> provides');
  function D() { return <b>{useContext(Theme)}</b>; } const r2 = await mount(<D />); ok(r2.host.textContent === 'light', 'no provider: default value'); }
// ref as a prop
{ function MyInput({ ref }: { ref?: any }) { return <input ref={ref} />; } const r: any = { current: null }; await mount(<MyInput ref={r} />); ok(r.current?.nodeName === 'INPUT', 'ref passed as a plain prop'); }
// useActionState shape
{ let st: any; function F() { st = useActionState(async (prev: number) => prev + 1, 0); return null; } await mount(<F />); ok(Array.isArray(st) && st.length === 3 && st[0] === 0 && typeof st[1] === 'function' && st[2] === false, 'useActionState: [state, action, isPending]'); }
// useOptimistic: shows optimistic while pending, reverts after
{ const shown: string[] = []; let send!: () => void; let resolve!: () => void;
  function Chat() { const [msgs, setMsgs] = useState<string[]>([]); const [opt, add] = useOptimistic(msgs, (s: string[], m: string) => [...s, m + ' (sending)']);
    shown.push(opt.join('|')); send = () => startTransition(async () => { add('hi'); await new Promise<void>(r => (resolve = r)); /* fail: no setMsgs */ }); return null; }
  await mount(<Chat />); await act(async () => send()); const during = shown.at(-1); await act(async () => { resolve(); await new Promise(r => setTimeout(r, 10)); });
  console.log('   optimistic during:', during, '| after:', JSON.stringify(shown.at(-1)));
  ok(during === 'hi (sending)' && shown.at(-1) === '', 'useOptimistic shows the guess while pending, then back to real state'); }
console.error = oe; done();
