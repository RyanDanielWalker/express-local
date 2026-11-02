// The code shown in questions that used to describe it in a sentence.
// Each block renders the question's code as written and checks its answer.
import { ok, done } from './harness.ts';
import { act, Component, Suspense, use, useActionState, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
ok(false, 'SANITY should fail');
const mount = async (el: ReactNode) => { const host = document.createElement('div'); document.body.appendChild(host); const root = createRoot(host); await act(async () => root.render(el)); return { host, root }; };
const tick = () => new Promise(r => setTimeout(r, 0));

// Count resize listeners on window.
let listeners = 0;
const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window);
window.addEventListener = ((t: string, f: any, o?: any) => { if (t === 'resize') listeners++; add(t, f, o); }) as any;
window.removeEventListener = ((t: string, f: any, o?: any) => { if (t === 'resize') listeners--; remove(t, f, o); }) as any;
const resize = (w: number) => { (window as any).innerWidth = w; window.dispatchEvent(new window.Event('resize')); };

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

// Hook Junction: Header never shows the width. A resize re-renders Header.
{ let headerRenders = 0;
  function Header() {
    headerRenders++;
    useWindowWidth();
    return <h1>Shop</h1>;
  }
  const { root } = await mount(<Header />); const before = headerRenders;
  await act(async () => resize(800));
  ok(headerRenders === before + 1, 'Header re-renders on a resize, though it never shows the width');
  await act(async () => root.unmount()); }

// Hook Junction: Header and Sidebar both call it. Two listeners once both are on screen.
{ listeners = 0;
  function Header() { const width = useWindowWidth(); return <h1>{width}</h1>; }
  function Sidebar() { const width = useWindowWidth(); return <aside>{width}</aside>; }
  const { root } = await mount(<><Header /><Sidebar /></>);
  ok(listeners === 2, `two resize listeners after the first render (got ${listeners})`);
  await act(async () => root.unmount());
  ok(listeners === 0, 'both removed on unmount'); }

// Fare Machine: <form action={signup}> resets uncontrolled inputs once signup finishes without throwing.
{ let calls = 0;
  async function signup(_fd: FormData) { calls++; }
  function SignupForm() {
    return (
      <form action={signup}>
        <input name="email" />
        <input name="password" type="password" />
        <button>Sign up</button>
      </form>
    );
  }
  const { host } = await mount(<SignupForm />);
  const [email, password] = host.querySelectorAll('input');
  email.value = 'ada@example.com'; password.value = 'hunter22';
  await act(async () => { host.querySelector('button')!.click(); await tick(); });
  ok(calls === 1, 'signup ran once');
  ok(email.value === '' && password.value === '', 'both inputs reset after signup finishes'); }

// Fare Machine: the action returns 'Email taken'. The uncontrolled email is still cleared.
{ const isTaken = async (e: unknown) => e === 'ada@example.com';
  let created = 0; const createUser = async (_fd: FormData) => { created++; };
  async function signup(_prev: string | null, formData: FormData) {
    if (await isTaken(formData.get('email'))) return 'Email taken';
    await createUser(formData);
    return null;
  }
  function SignupForm() {
    const [error, formAction] = useActionState(signup, null);
    return (
      <form action={formAction}>
        <input name="email" />
        {error && <p>{error}</p>}
        <button>Sign up</button>
      </form>
    );
  }
  const { host } = await mount(<SignupForm />);
  const email = host.querySelector('input')!;
  email.value = 'ada@example.com';
  await act(async () => { host.querySelector('button')!.click(); await tick(); });
  ok(host.querySelector('p')?.textContent === 'Email taken' && created === 0, 'the error shows and no user is created');
  ok(email.value === '', 'the typed email is cleared, though the action returned an error'); }

// Arrivals Board: use(userPromise) rejects. The error boundary's fallback shows, not the spinner.
{ class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
  }
  let reject!: (e: Error) => void;
  const userPromise = new Promise<{ name: string }>((_, r) => { reject = r; });
  let profileRendered = 0;
  function Profile() { const user = use(userPromise); profileRendered++; return <p>{user.name}</p>; }
  const Spinner = () => <i>loading</i>;
  const origErr = console.error; console.error = () => {};
  const { host } = await mount(
    <ErrorBoundary fallback={<p>Could not load</p>}>
      <Suspense fallback={<Spinner />}>
        <Profile />
      </Suspense>
    </ErrorBoundary>,
  );
  ok(host.textContent === 'loading', 'the spinner shows while the promise is pending');
  await act(async () => { reject(new Error('down')); await tick(); });
  console.error = origErr;
  ok(host.textContent === 'Could not load' && profileRendered === 0, 'after the rejection: the error fallback, and Profile never rendered'); }

done();
