import { ok, done } from './harness.ts';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
const warns: string[] = [];
console.error = (...a: any[]) => { warns.push(String(a[0]).slice(0, 100)); };
const box = document.createElement('div'); document.body.append(box);
let n = 0; function App() { n++; return <select value="blue"><option value="red">Red</option><option value="blue">Blue</option></select>; }
await act(async () => createRoot(box).render(<App />));
const s = box.querySelector('select')!;
await act(async () => { s.value = 'red'; s.dispatchEvent(new Event('change', { bubbles: true })); });
console.log('  after user picks red:', s.value, '| warns:', JSON.stringify(warns));
ok(s.value === 'blue', 'value without onChange snaps back to blue');
ok(warns.some(w => w.includes('onChange')), 'warns about onChange');
ok(false, 'SANITY should fail');
done();
