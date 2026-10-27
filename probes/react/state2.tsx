// Snapshot Line: a prop copied into state keeps its first value.
import { ok, done } from './harness.ts';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';

const el = document.createElement('div');
document.body.appendChild(el);
let renders = 0;
function Swatch({ color }: { color: string }) {
  renders++;
  const [shown] = useState(color);
  return <p>{shown}</p>;
}
const root = createRoot(el);
await act(() => root.render(<Swatch color="red" />));
await act(() => root.render(<Swatch color="blue" />));
console.log('text', el.textContent, 'renders', renders);
ok(el.textContent === 'red', 'Swatch still shows red after the parent passes blue');
ok(renders === 2, 'Swatch did re-render with the new prop, exactly once, and kept red');
await act(() => root.render(<Swatch color="green" />));
ok(el.textContent === 'red', 'more re-renders never pick the prop up');
await act(() => root.render(<Swatch key="b" color="blue" />));
ok(el.textContent === 'blue', 'a new key mounts a fresh Swatch, which starts from the prop');
ok(false, 'SANITY should fail');
done();
