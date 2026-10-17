import { ok, done } from './harness.ts';
import { act, Component, Suspense, use, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createRoot } from 'react-dom/client';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const oe = console.error; console.error = () => {};
const mount = async (el: any) => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
// forms snippet
const labels: string[] = [];
function SubmitButton() { const { pending } = useFormStatus(); labels.push(pending ? 'Saving...' : 'Save'); return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>; }
async function signup(email: any) { await sleep(20); return email === 'taken@x.co' ? { ok: false, message: 'Email taken' } : { ok: true, message: '' }; }
function SignupForm() {
  const [error, formAction] = useActionState(async (prev: string | null, formData: FormData) => { const res = await signup(formData.get('email')); return res.ok ? null : res.message; }, null);
  return <form action={formAction}><input name="email" type="email" required /><SubmitButton />{error && <p role="alert">{error}</p>}</form>;
}
{ const { host } = await mount(<SignupForm />); (host.querySelector('input') as any).value = 'taken@x.co';
  await act(async () => { (host.querySelector('button') as any).click(); await sleep(50); });
  console.log('   labels:', labels.join(','), '| alert:', host.querySelector('[role=alert]')?.textContent, '| input after:', JSON.stringify((host.querySelector('input') as any).value));
  ok(labels.includes('Saving...') && host.querySelector('[role=alert]')?.textContent === 'Email taken', 'forms snippet: pending label, error shown'); }
// data snippet with rejection
class ErrorBoundary extends Component<any, { error: any }> { state = { error: null as any }; static getDerivedStateFromError(error: any) { return { error }; } render() { if (this.state.error) return <p>Something went wrong.</p>; return this.props.children; } }
function Profile({ userPromise }: { userPromise: Promise<{ name: string }> }) { const user = use(userPromise); return <h1>{user.name}</h1>; }
function ProfilePage({ userPromise }: any) { return <ErrorBoundary><Suspense fallback={<i>spin</i>}><Profile userPromise={userPromise} /></Suspense></ErrorBoundary>; }
{ let rej!: (e: any) => void; const p = new Promise<any>((_, r) => (rej = r)); const { host } = await mount(<ProfilePage userPromise={p} />); const during = host.textContent;
  await act(async () => { rej(new Error('500')); await sleep(5); }); ok(during === 'spin' && host.textContent === 'Something went wrong.', 'data snippet: spinner, then boundary on rejection'); }
{ const p = Promise.resolve({ name: 'Ada' }); const { host } = await mount(<ProfilePage userPromise={p} />); await act(async () => { await sleep(5); }); ok(host.textContent === 'Ada', 'data snippet: resolves to the name'); }
ok(false, 'SANITY should fail');
console.error = oe; done();
