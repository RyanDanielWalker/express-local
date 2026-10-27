// Hook Junction: a custom hook's state belongs to the component that calls it.
import { ok, done } from './harness.ts';
import { act, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}
const renders = { header: 0, page: 0, sibling: 0 };
function Header() {
  renders.header++;
  useWindowWidth(); // the value is ignored on purpose
  return <h1>Title</h1>;
}
function Sibling() { renders.sibling++; return <p />; }
function Page() { renders.page++; return <div><Header /><Sibling /></div>; }

const el = document.createElement('div');
document.body.appendChild(el);
await act(() => createRoot(el).render(<Page />));
const before = { ...renders };
await act(() => {
  Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
  window.dispatchEvent(new window.Event('resize'));
});
console.log(before, renders);
ok(renders.header === before.header + 1, 'Header re-renders, though it never shows width');
ok(renders.page === before.page, 'the parent does not re-render');
ok(renders.sibling === before.sibling, 'a sibling does not re-render');
ok(false, 'SANITY should fail');
done();
