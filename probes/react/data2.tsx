import { ok, done } from './harness.ts';
import { act, startTransition, Suspense, use, useState } from 'react';
import { createRoot } from 'react-dom/client';
const logs: string[] = []; const ow = console.warn, oe = console.error; console.warn = (...a: any[]) => logs.push('warn ' + String(a[0]).slice(0, 100)); console.error = (...a: any[]) => logs.push('error ' + String(a[0]).slice(0, 100));
const mount = async (el: any) => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
{ let renders = 0; function U() { renders++; const v = use(new Promise<string>(r => setTimeout(() => r('v'), 5))); return <i>{v}</i>; }
  const { host } = await mount(<Suspense fallback={<s>wait</s>}><U /></Suspense>); await act(async () => { await sleep(400); });
  console.log('uncached promise after 400ms: renders', renders, '| text', host.textContent, '| logs', logs.filter(l => !/act\(/.test(l)).slice(0, 2)); }
{ let r!: () => void; const p = new Promise<void>(x => (r = x)); let setTab!: (t: string) => void;
  function Tab({ name }: { name: string }) { if (name === 'b') use(p); return <i id={'t' + name}>tab {name}</i>; }
  function App() { const [t, s] = useState('a'); setTab = s; return <Suspense fallback={<s>fallback</s>}><Tab name={t} /></Suspense>; }
  const { host } = await mount(<App />); await act(async () => { setTab('b'); await sleep(5); });
  const old = host.querySelector('#ta') as HTMLElement | null; console.log('plain update while suspending: old tab display =', old?.style.display, '| fallback shown =', !!host.querySelector('s'));
  ok(old?.style.display === 'none' && !!host.querySelector('s'), 'plain update: old content hidden, fallback shown'); await act(async () => { r(); await sleep(5); }); }
ok(false, 'SANITY should fail');
console.warn = ow; console.error = oe; done();
