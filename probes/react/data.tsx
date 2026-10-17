import { ok, done } from './harness.ts';
import { act, Component, lazy, startTransition, Suspense, use, useDeferredValue, useState } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const errs: string[] = []; const oe = console.error; console.error = (...a: any[]) => errs.push(a.map(String).join(' ').replace(/\s+/g, ' ').slice(0, 140));
const mount = async (el: any) => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
class Boundary extends Component<any, { err: string }> { state = { err: '' }; static getDerivedStateFromError(e: any) { return { err: e.message }; } render() { return this.state.err ? <b>caught {this.state.err}</b> : this.props.children; } }
// suspense flow with use()
{ const log: string[] = []; let resolve!: (v: string) => void; const p = new Promise<string>(r => (resolve = r));
  function Profile() { log.push('render Profile'); const user = use(p); log.push('got ' + user); return <i>{user}</i>; }
  function Spinner() { log.push('fallback'); return <s>loading</s>; }
  const { host } = await mount(<Suspense fallback={<Spinner />}><Profile /></Suspense>); const during = host.textContent;
  await act(async () => { resolve('Ada'); await sleep(5); });
  console.log('  ', log.join(' > '), '| during:', during, '| after:', host.textContent);
  ok(during === 'loading' && host.textContent === 'Ada' && !log.includes('got undefined'), 'Suspense shows fallback, then content'); }
// lazy
{ let res!: (m: any) => void; const Chart = lazy(() => new Promise<any>(r => (res = r)));
  const { host } = await mount(<Suspense fallback={<s>skeleton</s>}><Chart /></Suspense>); const during = host.textContent; await act(async () => { res({ default: () => <i>chart</i> }); await sleep(5); });
  ok(during === 'skeleton' && host.textContent === 'chart', 'lazy component shows the Suspense fallback while its code loads'); }
// error boundary: render error caught, handler error not, timeout not
{ function Bad() { throw new Error('boom'); return null; } const { host } = await mount(<Boundary><Bad /></Boundary>); ok(host.textContent === 'caught boom', 'boundary catches render error'); }
{ let clickErr = ''; window.addEventListener('error', (e: any) => { clickErr = e.message; e.preventDefault?.(); });
  function Btn() { return <button onClick={() => { throw new Error('click boom'); }}>x</button>; }
  const { host } = await mount(<Boundary><Btn /></Boundary>); await act(async () => { (host.querySelector('button') as any).click(); });
  console.log('   handler error ->', clickErr, '| host:', host.textContent); ok(host.textContent === 'x', 'boundary does not catch handler errors'); }
// boundary does not catch its own error
{ class Self extends Component<any, any> { state = { e: '' }; static getDerivedStateFromError(e: any) { return { e: e.message }; } render(): any { if (!this.state.e) throw new Error('self'); return 'self caught'; } }
  const { host } = await mount(<Boundary><Self /></Boundary>); console.log('   self-throwing boundary ->', host.textContent); }
// boundary below the child doesn't catch
{ function Bad() { throw new Error('up'); return null; } let topErr = ''; class Top extends Component<any, any> { state = { e: '' }; static getDerivedStateFromError(e: any) { return { e: 'top ' + e.message }; } render() { return this.state.e || this.props.children; } }
  function Parent() { return <div><Bad /><Boundary><i>inner</i></Boundary></div>; } const { host } = await mount(<Top><Parent /></Top>); ok(host.textContent === 'top up', 'only a boundary above the thrower catches'); }
// reset by key
{ let fail = true; let setK!: (k: number) => void; function Flaky() { if (fail) throw new Error('flaky'); return <i>ok</i>; }
  function App() { const [k, s] = useState(0); setK = s; return <Boundary key={k}><Flaky /></Boundary>; }
  const { host } = await mount(<App />); const before = host.textContent; fail = false; await act(async () => setK(1)); ok(before === 'caught flaky' && host.textContent === 'ok', 'changing the boundary key retries'); }
// uncached promise in render
{ errs.length = 0; let renders = 0; function U() { renders++; const v = use(new Promise<string>(r => setTimeout(() => r('v'), 5))); return <i>{v}</i>; }
  const { host } = await mount(<Suspense fallback={<s>wait</s>}><U /></Suspense>); await act(async () => { await sleep(80); });
  console.log('   uncached promise: renders', renders, '| text', host.textContent, '|', errs.find(e => /uncached|not yet supported/.test(e))?.slice(0, 100)); }
// nested boundaries
{ let resolveFeed!: () => void; const feed = new Promise<void>(r => (resolveFeed = r)); function Feed() { use(feed); return <i>feed</i>; } function Side() { return <i>side</i>; }
  const { host } = await mount(<div><Suspense fallback={<s>side…</s>}><Side /></Suspense><Suspense fallback={<s>feed…</s>}><Feed /></Suspense></div>);
  ok(host.textContent === 'sidefeed…', 'only the slow part shows its fallback'); await act(async () => { resolveFeed(); await sleep(5); }); }
// Transitions versus plain updates are checked in data2.tsx. A plain update keeps the old
// content in the DOM with display: none, so reading textContent here gave the wrong answer.
// useDeferredValue
{ const seen: string[] = []; let setQ!: (q: string) => void; function List({ q }: { q: string }) { seen.push(q); return null; }
  function App() { const [q, s] = useState('a'); setQ = s; const dq = useDeferredValue(q); return <><i>{q}</i><List q={dq} /></>; }
  await mount(<App />); seen.length = 0; await act(async () => setQ('ab')); console.log('   deferred renders of List:', seen.join(',')); ok(seen[0] === 'a' && seen.at(-1) === 'ab', 'deferred value lags, then catches up'); }
console.error = oe; done();
