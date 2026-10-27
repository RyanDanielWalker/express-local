type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type User = { id: string; name: string };

// any vs unknown
function f1(a: any, u: unknown) {
  a.foo.bar();               // any: compiles
  // @ts-expect-error unknown: cannot call methods
  u.toFixed();
  if (typeof u === 'number') u.toFixed();
}
// any spreads
declare const data: any;
const name = data.user.name; const t1: IsAny<typeof name> = true;
// using unknown
function f2(value: unknown) {
  if (typeof value === 'string') value.toUpperCase();
  // @ts-expect-error truthy is not enough
  if (value) value.toUpperCase();
}
// JSON.parse and res.json are any
const j = JSON.parse('{}'); const t2: IsAny<typeof j> = true;
async function f3(res: Response) { const r = await res.json(); const t: IsAny<typeof r> = true; const raw: unknown = await res.json(); }
// as refuses non-overlapping
// @ts-expect-error string as number
const n1 = 'hello' as number;
const n2 = 'hello' as unknown as number;
declare const blob: object;
const u1 = blob as User; // overlapping enough: allowed
// ?. vs !
const el = document.getElementById('root');
const tc = el?.textContent; const t3: Expect<typeof tc, string | undefined> = true;
const tc2 = el!.textContent; const tc3 = (el as HTMLElement).textContent;

// satisfies: does it keep the literal 3000?
type Config = { port: number };
const config = { port: 3000 } satisfies Config;
const t4: Expect<typeof config.port, number> = true;   // widened, NOT 3000
// satisfies keeps exact keys
const routes = { home: '/', about: '/about' } satisfies Record<string, string>;
routes.home;
// @ts-expect-error not a key
routes.contact;
const routesA: Record<string, string> = { home: '/', about: '/about' };
const c = routesA.contact; const t5: Expect<typeof c, string> = true;
// @ts-expect-error satisfies still checks values
const bad = { home: 404 } satisfies Record<string, string>;
// where satisfies keeps a narrower value type
type Cfg2 = { port: number | string };
const cfg2 = { port: 3000 } satisfies Cfg2; const t6: Expect<typeof cfg2.port, number> = true;
const cfg3: Cfg2 = { port: 3000 }; const t7: Expect<typeof cfg3.port, number | string> = true;

// never
function fail(msg: string): never { throw new Error(msg); }
function failInferred(msg: string) { throw new Error(msg); }
const t8: Expect<ReturnType<typeof failInferred>, void> = true;   // declarations infer void
const failArrow = (msg: string) => { throw new Error(msg); };
const t9: Expect<ReturnType<typeof failArrow>, never> = true;     // arrows infer never
// @ts-expect-error nothing fits in never
const nv: never = 1;
// catch variable
try {} catch (err) { const t: Expect<typeof err, unknown> = true; }
export {};

// Q (replaced "What is never good for?"): @ts-expect-error vs @ts-ignore
function directives() {
  // @ts-expect-error hides the error on the next line
  const a: number = 'x';
  // @ts-ignore hides it too
  const b: number = 'y';
  // @ts-ignore on a line with no error: silent, compiles
  const c: number = 1;
}
