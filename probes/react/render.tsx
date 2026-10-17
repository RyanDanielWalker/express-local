import { ok, done } from './harness.ts';
import { act, createContext, memo, StrictMode, useContext, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const mount = async (el: ReactNode) => { const host = document.createElement('div'); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
let renders: Record<string, number> = {}; const hit = (k: string) => { renders[k] = (renders[k] ?? 0) + 1; };
const reset = () => { renders = {}; };

// 1. parent state -> child with no props re-renders; memo child with same props does not
let bump!: () => void;
function Kid() { hit('kid'); return <i>kid</i>; }
const MemoKid = memo(function MemoKid({ n }: { n: number }) { hit('memo'); return <b>{n}</b>; });
const MemoObj = memo(function MemoObj({ style }: { style: object }) { hit('memoObj'); return <b />; });
function Parent() { const [c, setC] = useState(0); bump = () => setC(x => x + 1); hit('parent'); return <><Kid /><MemoKid n={1} /><MemoObj style={{ margin: 8 }} /><span>{c}</span></>; }
await mount(<Parent />); reset(); await act(async () => bump());
ok(renders.parent === 1 && renders.kid === 1, 'child with no props re-renders with parent');
ok(!renders.memo, 'memo child with same primitive props skips');
ok(renders.memoObj === 1, 'memo child with inline object re-renders');

// 2. DOM only touched where output differs
{ let set!: (n: number) => void; function C() { const [n, s] = useState(0); set = s; return <div><p id="static">same</p><p id="n">{n}</p></div>; }
  const { host } = await mount(<C />); const staticNode = host.querySelector('#static')!; const textNode = host.querySelector('#n')!.firstChild;
  const mutations: string[] = []; const mo = new MutationObserver(ms => ms.forEach(m => mutations.push(m.type + ':' + (m.target as any).nodeName)));
  mo.observe(host, { subtree: true, childList: true, characterData: true, attributes: true });
  await act(async () => set(1)); await new Promise(r => setTimeout(r, 0));
  ok(host.querySelector('#static') === staticNode && host.querySelector('#n')!.firstChild === textNode && host.textContent === 'same1', 'same DOM nodes kept, only text updated');
  console.log('   mutations:', mutations.join(', '));
  await act(async () => set(1)); }

// 3. setState with same value
{ let set!: (n: number) => void; let r = 0; function Child() { hit('sameChild'); return null; }
  function C() { const [n, s] = useState(5); set = s; r++; return <Child />; }
  await mount(<C />); reset(); const before = r; await act(async () => set(5)); await act(async () => set(5));
  ok(!renders.sameChild, 'same value: children not rendered'); console.log('   component extra renders on same value x2:', r - before); }

// 4. context readers re-render, even through memo
{ const Ctx = createContext({ v: 0 }); let set!: (n: number) => void;
  const Reader = memo(function Reader() { useContext(Ctx); hit('reader'); return null; });
  const NonReader = memo(function NonReader() { hit('nonreader'); return null; });
  function App() { const [v, s] = useState(0); set = s; return <Ctx value={{ v }}><Reader /><NonReader /></Ctx>; }
  await mount(<App />); reset(); await act(async () => set(1));
  ok(renders.reader === 1 && !renders.nonreader, 'memo reader re-renders on context change, memo non-reader skips'); }

// 5. children as prop keeps identity
{ let toggle!: () => void; function Heavy() { hit('heavy'); return null; }
  function Layout({ children }: { children: ReactNode }) { const [o, s] = useState(false); toggle = () => s(x => !x); hit('layout'); return <div>{String(o)}{children}</div>; }
  await mount(<Layout><Heavy /></Layout>); reset(); await act(async () => toggle());
  ok(renders.layout === 1 && !renders.heavy, 'children passed as prop skip when only Layout re-renders'); }

// 6. plain variable
{ let click!: () => void; function C() { let count = 0; click = () => { count = count + 1; }; return <p>{count}</p>; }
  const { host } = await mount(<C />); await act(async () => click()); ok(host.textContent === '0', 'plain variable: screen still shows 0'); }

// 7. useState kept across re-render; ref change no re-render
{ let set!: (n: number) => void; let setRef!: () => void; let r = 0;
  function C() { const [a] = useState(() => Math.random()); const [n, s] = useState(0); const ref = useRef(''); set = s; setRef = () => { ref.current = 'x'; }; r++; (globalThis as any).a = a; return <p>{n}</p>; }
  await mount(<C />); const a0 = (globalThis as any).a; await act(async () => set(1)); ok((globalThis as any).a === a0, 'useState value kept across re-render');
  const b = r; await act(async () => setRef()); ok(r === b, 'ref.current change does not re-render'); }

// 8. StrictMode double-calls component in development
{ let calls = 0; function C() { calls++; return null; }
  await mount(<StrictMode><C /></StrictMode>); console.log('   NODE_ENV', process.env.NODE_ENV, 'strict mount calls', calls);
  ok(calls === 2, 'StrictMode calls the component twice in dev'); }

// 9. re-render starts at the component that changed
{ let set!: (n: number) => void; function Top() { hit('top'); return <Mid />; } function Mid() { const [n, s] = useState(0); set = s; hit('mid'); return <Leaf n={n} />; } function Leaf({ n }: { n: number }) { hit('leaf'); return <i>{n}</i>; }
  await mount(<Top />); reset(); await act(async () => set(1)); ok(!renders.top && renders.mid === 1 && renders.leaf === 1, 'starts at the changed component, goes down'); }
done();
