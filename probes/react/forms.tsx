import { ok, done } from './harness.ts';
import { act, useActionState, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useFormStatus } from 'react-dom';
ok(false, 'SANITY should fail');
const errs: string[] = []; const oe = console.error; console.error = (...a: any[]) => errs.push(a.map(String).join(' ').replace(/\s+/g, ' ').slice(0, 130));
const mount = async (el: any) => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const type = (el: HTMLInputElement, v: string) => { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!; setter.call(el, v); el.dispatchEvent(new window.Event('input', { bubbles: true })); };
// value without onChange
{ errs.length = 0; const { host } = await mount(<input value="Ada" />); const i = host.querySelector('input')!; await act(async () => type(i, 'Adam')); await sleep(0);
  console.log('   readonly value after typing:', i.value, '|', errs[0]?.slice(0, 90)); ok(i.value === 'Ada' && errs.some(e => /without an `onChange`/.test(e)), 'value without onChange: stays, warns'); }
// defaultValue later change ignored
{ let set!: (v: string) => void; function C() { const [v, s] = useState('a'); set = s; return <input defaultValue={v} />; } const { host } = await mount(<C />); await act(async () => set('b')); ok(host.querySelector('input')!.value === 'a', 'defaultValue change after mount does not update'); }
// number input value is string
{ const { host } = await mount(<input type="number" defaultValue={42} />); ok(typeof host.querySelector('input')!.value === 'string', 'number input value is a string'); }
// htmlFor vs for
{ errs.length = 0; const { host } = await mount(<><label {...({ for: 'e' } as any)}>E</label><label htmlFor="f">F</label></>); const [a, b] = host.querySelectorAll('label');
  console.log('   for attr:', a.getAttribute('for'), '| htmlFor attr:', b.getAttribute('for'), '|', errs[0]?.slice(0, 90)); ok(b.getAttribute('for') === 'f', 'htmlFor sets for'); }
// form action receives FormData, resets uncontrolled fields, pending order
{ const log: string[] = []; let got: any;
  function Btn() { const { pending } = useFormStatus(); log.push('button pending=' + pending); return <button type="submit">go</button>; }
  async function signup(fd: FormData) { log.push('action called'); got = fd; await sleep(20); log.push('action done'); }
  function F() { return <form action={signup}><input name="email" defaultValue="" /><Btn /></form>; }
  const { host } = await mount(<F />); const i = host.querySelector('input')!; i.value = 'a@b.co'; log.length = 0;
  await act(async () => { (host.querySelector('button') as any).click(); await sleep(60); });
  console.log('   ', log.join(' > '), '| email:', got?.get?.('email'), '| field after:', JSON.stringify(i.value));
  ok(got instanceof window.FormData || typeof got?.get === 'function', 'action receives FormData');
  ok(i.value === '', 'uncontrolled field reset after action'); }
// useFormStatus in same component as form: always false
{ const seen: boolean[] = [];
  function F() { const { pending } = useFormStatus(); seen.push(pending); return <form action={async () => { await sleep(20); }}><button>go</button></form>; }
  const { host } = await mount(<F />); await act(async () => { (host.querySelector('button') as any).click(); await sleep(50); }); ok(seen.every(p => p === false), 'useFormStatus in the form owner never sees pending'); }
// useActionState: isPending until promise settles
{ const seen: string[] = []; let fa: any;
  function F() { const [state, formAction, isPending] = useActionState(async (prev: number) => { await sleep(30); return prev + 1; }, 0); fa = formAction; seen.push(state + ':' + isPending); return <form action={formAction}><button>go</button></form>; }
  const { host } = await mount(<F />); await act(async () => { (host.querySelector('button') as any).click(); await sleep(10); }); const mid = seen.at(-1); await act(async () => { await sleep(50); });
  console.log('   useActionState renders:', seen.join(' ')); ok(mid === '0:true' && seen.at(-1) === '1:false', 'isPending true until the action settles'); }
// form.submit() skips onSubmit, requestSubmit runs it
{ let calls = 0; const { host } = await mount(<form onSubmit={e => { e.preventDefault(); calls++; }}><input required name="x" /></form>); const f = host.querySelector('form')! as any;
  try { f.submit(); } catch {} const afterSubmit = calls; f.requestSubmit(); const afterReq = calls; console.log('   submit():', afterSubmit, 'requestSubmit() with empty required:', afterReq);
  (host.querySelector('input') as any).value = 'ok'; f.requestSubmit(); ok(afterSubmit === 0 && calls >= 1, 'submit() skips onSubmit; requestSubmit runs it'); }
// preventDefault in onSubmit
{ let prevented = false; const { host } = await mount(<form onSubmit={e => { e.preventDefault(); prevented = e.defaultPrevented; }}><button>go</button></form>); (host.querySelector('form') as any).requestSubmit(); ok(prevented, 'onSubmit preventDefault'); }
// file input: value can't be set
{ errs.length = 0; let threw = ''; try { const { host } = await mount(<input type="file" value="" onChange={() => {}} />); } catch (e: any) { threw = e.message; } console.log('   file input controlled:', threw.slice(0, 80) || 'no throw', '|', errs.slice(0, 1)); }
console.error = oe; done();
