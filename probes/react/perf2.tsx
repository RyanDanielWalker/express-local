// Memo Yard: a custom memo compare that skips a function prop, and onRender on <Profiler>.
// Run in both builds: npm run probe -- perf2.tsx, then npm run probe:prod -- perf2.tsx
import { ok, done } from './harness.ts';
import { memo, Profiler, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createRoot as createProfilingRoot } from 'react-dom/profiling';

// Timeouts instead of act(), so one file runs in both builds.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
const dev = process.env.NODE_ENV !== 'production';
const tick = () => new Promise(r => setTimeout(r, 30));
const container = document.createElement('div');
document.body.appendChild(container);

// 1. memo(Row, (a, b) => a.id === b.id): returning true means "equal, skip".
let rowRenders = 0;
const logged: number[] = [];
function RowImpl({ id, onSelect }: { id: number; onSelect: () => void }) {
  rowRenders++;
  return <button id={`row${id}`} onClick={onSelect}>row</button>;
}
const Row = memo(RowImpl, (a, b) => a.id === b.id);
const PlainMemoRow = memo(RowImpl);
let bump!: () => void;
function List({ custom }: { custom: boolean }) {
  const [count, setCount] = useState(0);
  bump = () => setCount(c => c + 1);
  const R = custom ? Row : PlainMemoRow;
  return <R id={1} onSelect={() => logged.push(count)} />;
}
const root = createRoot(container);
root.render(<List custom />); await tick();
bump(); await tick(); bump(); await tick();
(container.querySelector('#row1') as HTMLButtonElement).click(); await tick();
console.log('custom compare: row renders', rowRenders, 'logged', logged);
ok(rowRenders === 1, 'custom compare returning true skips Row on every parent render');
ok(logged[0] === 0, 'Row still calls the first onSelect, which sees count 0 (stale)');

// Without the custom compare, Row re-renders and gets the fresh handler.
root.unmount();
rowRenders = 0; logged.length = 0;
const root2 = createRoot(container);
root2.render(<List custom={false} />); await tick();
bump(); await tick(); bump(); await tick();
(container.querySelector('#row1') as HTMLButtonElement).click(); await tick();
console.log('plain memo: row renders', rowRenders, 'logged', logged);
ok(rowRenders === 3 && logged[0] === 2, 'plain memo re-renders on the new arrow and sees count 2');
root2.unmount();

// 2. <Profiler onRender>: fires in development, not in a plain production build.
const commits: string[] = [];
let set!: (n: number) => void;
function App() { const [n, s] = useState(0); set = s; return <p>{n}</p>; }
const root3 = createRoot(container);
root3.render(<Profiler id="app" onRender={(id, phase) => commits.push(phase)}><App /></Profiler>); await tick();
set(1); await tick(); set(2); await tick();
console.log(dev ? 'development' : 'production', 'onRender phases', commits);
if (dev) ok(commits.length === 3 && commits[0] === 'mount', 'development: onRender runs on every commit, mount then updates');
else ok(commits.length === 0, 'production: onRender never runs');
ok(container.textContent === '2', 'the app itself still renders and updates');
root3.unmount();

// React's profiling build (react-dom/profiling) turns onRender back on in production.
const profiled: string[] = [];
const root4 = createProfilingRoot(container);
root4.render(<Profiler id="app" onRender={(id, phase) => profiled.push(phase)}><App /></Profiler>); await tick();
set(1); await tick();
console.log('profiling build onRender phases', profiled);
ok(profiled.length === 2, 'the profiling build runs onRender, even in production');
ok(false, 'SANITY should fail');
done();
