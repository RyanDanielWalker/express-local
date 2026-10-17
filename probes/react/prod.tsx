import './harness.ts';
import { StrictMode, useState, act } from 'react';
import { createRoot } from 'react-dom/client';
let calls = 0; function C() { calls++; return null; }
const root = createRoot(document.createElement('div')); root.render(<StrictMode><C /></StrictMode>);
await new Promise(r => setTimeout(r, 50)); console.log('production strict calls', calls);
// same-value after a different update: does the component render once more?
let r = 0, child = 0; let set!: (n: number) => void;
function Child() { child++; return null; }
function D() { const [n, s] = useState(5); set = s; r++; return <Child />; }
const root2 = createRoot(document.createElement('div')); root2.render(<D />); await new Promise(x => setTimeout(x, 20));
set(6); await new Promise(x => setTimeout(x, 20)); const r1 = r, c1 = child;
set(6); await new Promise(x => setTimeout(x, 20)); console.log('same value after an update: component renders', r - r1, 'children renders', child - c1);
