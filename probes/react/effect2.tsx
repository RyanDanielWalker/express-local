import './harness.ts';
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
const errs: string[] = []; const oe = console.error; console.error = (...a: any[]) => errs.push(a.join(' ').slice(0, 200));
function C() { useEffect((async () => { await 0; }) as any, []); return null; }
const root = createRoot(document.createElement('div')); await act(async () => root.render(<C />));
console.error = oe; console.log('mount errors:', errs);
let crashed = ''; try { await act(async () => root.unmount()); } catch (e: any) { crashed = e.message; }
console.log('unmount:', crashed);
