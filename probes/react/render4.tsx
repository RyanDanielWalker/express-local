// Repaint Line: three questions that replaced the cross-line near-duplicates of Memo Yard.
// 1. A child calls a setter it got from its parent. Who re-renders?
// 2. A provider re-renders with an inline value object. Do readers inside its children re-render?
// 3. onClick={setCount(count + 1)} calls the setter during render. What happens?
// Run in development and production.
import { ok, done } from './harness.ts';
import { createContext, memo, useContext, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const prod = process.env.NODE_ENV === 'production';
const tick = () => new Promise(r => setTimeout(r, 20));
const run = async (fn: () => void) => {
  if (prod) { fn(); await tick(); } else await act(async () => fn());
};
const mount = () => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
};

// 1. The setter belongs to Parent, so Parent re-renders, and Input with it.
{
  const renders = { parent: 0, input: 0, other: 0 };
  let type!: (v: string) => void;
  function Input({ onChange }: { onChange: (v: string) => void }) {
    renders.input++;
    type = onChange;
    return <input />;
  }
  function Other() { renders.other++; return <p />; }
  function Parent() {
    renders.parent++;
    const [text, setText] = useState('');
    return <div><Input onChange={setText} /><span>{text}</span></div>;
  }
  const el = mount();
  await run(() => createRoot(el).render(<><Parent /><Other /></>));
  const before = { ...renders };
  await run(() => type('a'));
  console.log('1.', before, renders);
  ok(renders.parent === before.parent + 1, '1. Parent re-renders, though Input made the call');
  ok(renders.input === before.input + 1, '1. Input re-renders too, as a child of Parent');
  ok(renders.other === before.other, '1. a component outside Parent does not re-render');
  ok(el.querySelector('span')!.textContent === 'a', '1. the new text reached the page');
}

// 1b. The question's exact code: typing in the input. Who renders first? And with memo, Input would skip.
for (const wrap of [false, true]) {
  const order: string[] = [];
  function InputImpl({ onChange }: { onChange: (v: string) => void }) {
    order.push('Input');
    return <input onChange={e => onChange(e.target.value)} />;
  }
  const Input = wrap ? memo(InputImpl) : InputImpl;
  function Parent() {
    order.push('Parent');
    const [, setText] = useState('');
    return <Input onChange={setText} />;
  }
  const el = mount();
  await run(() => createRoot(el).render(<Parent />));
  order.length = 0;
  const input = el.querySelector('input')!;
  await run(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, 'a');
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  console.log('1b. memo', wrap, order);
  if (!wrap) ok(order.join() === 'Parent,Input', '1b. typing renders Parent first, then Input');
  else ok(order.join() === 'Parent', '1b. with memo, Input would skip (so the code must show a plain Input)');
}

// 2. Provider with an inline value. tick changes, user does not.
{
  const Ctx = createContext<{ user: string; setUser: (u: string) => void } | null>(null);
  const renders = { shell: 0, reader: 0, memoReader: 0 };
  let bump!: () => void;
  function Reader() { renders.reader++; useContext(Ctx); return <i />; }
  const MemoReader = memo(function MemoReader() { renders.memoReader++; useContext(Ctx); return <b />; });
  function Shell() { renders.shell++; return <div><Reader /><MemoReader /></div>; }
  function UserProvider({ children, stable }: { children: React.ReactNode; stable?: boolean }) {
    const [user, setUser] = useState('ada');
    const [n, setN] = useState(0);
    bump = () => setN(x => x + 1);
    const memoValue = useMemo(() => ({ user, setUser }), [user]);
    void n;
    return <Ctx value={stable ? memoValue : { user, setUser }}>{children}</Ctx>;
  }
  const el = mount();
  const root = createRoot(el);
  await run(() => root.render(<UserProvider><Shell /></UserProvider>));
  let before = { ...renders };
  await run(() => bump());
  console.log('2. inline', before, renders);
  ok(renders.shell === before.shell, '2. Shell skips: children is the same element from above');
  ok(renders.reader === before.reader + 1, '2. Reader re-renders: the value is a new object');
  ok(renders.memoReader === before.memoReader + 1, '2. even a memo reader re-renders');

  const el2 = mount();
  const root2 = createRoot(el2);
  Object.assign(renders, { shell: 0, reader: 0, memoReader: 0 });
  await run(() => root2.render(<UserProvider stable><Shell /></UserProvider>));
  before = { ...renders };
  await run(() => bump());
  console.log('2. useMemo value', before, renders);
  ok(renders.reader === before.reader && renders.memoReader === before.memoReader,
    '2. with the value in useMemo, the readers skip: the new object was the cause');
}

// 3. onClick={setCount(count + 1)}: the setter runs during render, every render.
{
  let renders = 0;
  const errors: unknown[] = [];
  function Counter() {
    renders++;
    const [count, setCount] = useState(0);
    // @ts-expect-error the classic mistake: calling the setter instead of passing a function
    return <button onClick={setCount(count + 1)}>{count}</button>;
  }
  const el = mount();
  const root = createRoot(el, { onUncaughtError: e => errors.push(e) });
  try { await run(() => root.render(<Counter />)); } catch (e) { errors.push(e); }
  const msg = String((errors[0] as Error)?.message ?? '');
  console.log('3. renders', renders, 'errors', errors.length, 'message:', msg.slice(0, 160));
  ok(errors.length >= 1, '3. React throws an error');
  ok(prod ? msg.includes('301') : msg.includes('Too many re-renders'),
    '3. the error is "Too many re-renders" (minified error 301 in production)');
  ok(renders > 2, '3. it rendered many times before giving up, not once');
  ok(el.querySelector('button') === null, '3. no button ever reaches the page, so there is nothing to click');
}

// 3b. Curiosity: the same with setOpen(true), a value that stops changing.
{
  let renders = 0;
  const errors: unknown[] = [];
  function Menu() {
    renders++;
    const [open, setOpen] = useState(false);
    // @ts-expect-error same mistake
    return <button onClick={setOpen(true)}>{String(open)}</button>;
  }
  const el = mount();
  const root = createRoot(el, { onUncaughtError: e => errors.push(e) });
  try { await run(() => root.render(<Menu />)); } catch (e) { errors.push(e); }
  console.log('3b. setOpen(true): renders', renders, 'errors', errors.length, String((errors[0] as Error)?.message ?? '').slice(0, 80), 'html', el.innerHTML);
}

ok(false, 'SANITY should fail');
done();
