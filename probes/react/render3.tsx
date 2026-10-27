// Repaint Line: a parent re-renders and passes a brand new arrow to <button onClick>.
import { ok, done } from './harness.ts';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.createElement('div');
document.body.appendChild(container);
const seen: number[] = [];
let bump!: () => void;
function Parent() {
  const [count, setCount] = useState(0);
  bump = () => setCount(c => c + 1);
  return <button onClick={() => seen.push(count)}>Save</button>;
}
const root = createRoot(container);
await act(() => root.render(<Parent />));
const first = container.querySelector('button')!;
const listeners: string[] = [];
const realAdd = first.addEventListener.bind(first);
first.addEventListener = ((type: string, ...rest: any[]) => { listeners.push(type); return (realAdd as any)(type, ...rest); }) as any;
const removed: Node[] = [];
const added: Node[] = [];
const attrs: string[] = [];
const mo = new MutationObserver(list => list.forEach(m => {
  m.removedNodes.forEach(n => removed.push(n));
  m.addedNodes.forEach(n => added.push(n));
  if (m.type === 'attributes') attrs.push(m.attributeName!);
}));
mo.observe(container, { childList: true, subtree: true, attributes: true, characterData: true });
await act(() => bump());
await act(() => bump());
const after = container.querySelector('button')!;
await act(() => after.click());
await Promise.resolve();
const records = mo.takeRecords();
console.log('removed', removed.length, 'added', added.length, 'attrs', attrs, 'pending', records.length, 'click saw', seen);
ok(after === first, 'the same <button> element is still in the page');
ok(removed.length === 0 && added.length === 0, 'React did not remove or add any node');
ok(attrs.length === 0, 'React did not touch any attribute (no onclick attribute either)');
ok(seen.length === 1 && seen[0] === 2, 'one click runs the newest handler once, and it sees count 2');
ok(listeners.length === 0, 'React never calls addEventListener on the button itself');
ok(first.getAttribute('onclick') === null, 'the handler is not written into the DOM');
ok(false, 'SANITY should fail');
done();
