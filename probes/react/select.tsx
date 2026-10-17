import { ok, done } from './harness.ts';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
const warns: string[] = [];
const oe = console.error; console.error = (...a: any[]) => { warns.push(String(a[0]).slice(0, 120)); };
const box = document.createElement('div'); document.body.append(box);
const root = createRoot(box);
// A: defaultValue on select
await act(async () => root.render(<select id="a" defaultValue="blue"><option value="red">Red</option><option value="blue">Blue</option></select>));
const a = document.getElementById('a') as HTMLSelectElement;
ok(a.value === 'blue', 'defaultValue on select starts on blue: ' + a.value);
a.value = 'red'; a.dispatchEvent(new Event('change', { bubbles: true }));
ok(a.value === 'red', 'user can change it: ' + a.value);
ok(warns.length === 0, 'no warnings for defaultValue: ' + warns.join(' / '));
// B: selected on option
await act(async () => root.render(<select id="b"><option value="red">Red</option><option value="blue" selected>Blue</option></select>));
const b = document.getElementById('b') as HTMLSelectElement;
console.log('  selected on option -> value', b.value, '| warns:', warns);
// C: checked on option
warns.length = 0;
await act(async () => root.render(<select id="c">{/* @ts-ignore */}<option value="red">Red</option><option value="blue" {...({ checked: true } as any)}>Blue</option></select>));
const c = document.getElementById('c') as HTMLSelectElement;
console.log('  checked on option -> value', c.value, '| warns:', warns);
ok(c.value === 'red', 'checked on option does nothing: ' + c.value);
// sanity
ok(false, 'SANITY should fail');
console.error = oe;
done();
