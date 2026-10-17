import { useState, type ReactNode } from 'react';
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { id: string; name: string; email: string };
declare const users: User[];

// first<T>
function first<T>(items: T[]): T | undefined { return items[0]; }
const f1 = first(['a', 'b']); const t1: Expect<typeof f1, string | undefined> = true;
const f2 = first(users); const t2: Expect<typeof f2, User | undefined> = true;
// @ts-expect-error explicit number with strings
first<number>(['a', 'b']);

// Array<string> is string[]
const t3: Expect<Array<string>, string[]> = true;

// Promise<User> awaited
async function getUser(): Promise<User> { return users[0]; }
async function use() { const u = await getUser(); const t: Expect<typeof u, User> = true; const p = getUser(); const t2: Expect<typeof p, Promise<User>> = true; }

// empty Set infers unknown
const s1 = new Set(); const t4: Expect<typeof s1, Set<unknown>> = true;
const s2 = new Set([1, 2]); const t5: Expect<typeof s2, Set<number>> = true;
type IsAny<T> = 0 extends 1 & T ? true : false;
const m1 = new Map(); const t6: IsAny<ReturnType<typeof m1.get>> = true; m1.set(1, 'x'); m1.set('y', 2); const s1x: IsAny<ReturnType<typeof s1.has>> = false;

// identity
function identity<T>(x: T): T { return x; }
const i1 = identity('hi'); const t7: Expect<typeof i1, string> = true;
function idAny(x: any): any { return x; }
const i2 = idAny('hi'); const t8: Expect<typeof i2, any> = true;

// constraint keeps the full type
function byId<T extends { id: string }>(items: T[], id: string): T | undefined { return items.find(i => i.id === id); }
const b1 = byId(users, '7'); const t9: Expect<typeof b1, User | undefined> = true;
declare const orders: { id: string; total: number }[];
const b2 = byId(orders, 'A1'); const t10: Expect<typeof b2, { id: string; total: number } | undefined> = true;
// @ts-expect-error no id
byId([{ name: 'Ana' }], '7');
// @ts-expect-error strings have no id
byId(['a', 'b'], 'a');
// @ts-expect-error id is a number
byId([{ id: 7 }], '7');
byId([{ id: '1', tags: [] }], '1');

// keyof + indexed access
function get<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
const user = { id: '1', age: 38 };
const g1 = get(user, 'age'); const t11: Expect<typeof g1, number> = true;
// @ts-expect-error not a key
get(user, 'nope');

// as const
const config = { mode: 'dark' } as const; const t12: Expect<typeof config, { readonly mode: 'dark' }> = true;
const config2 = { mode: 'dark' }; const t13: Expect<typeof config2, { mode: string }> = true;

// T only in return type -> unknown
function make<T>(): T { return null as T; }
const mk = make(); const t14: Expect<typeof mk, unknown> = true;

// default type parameter
interface ApiResponse<T = unknown> { data: T }
const t15: Expect<ApiResponse, ApiResponse<unknown>> = true;

// generic component
function List<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) { return <>{items.map(render)}</>; }
const el = <List items={users} render={u => { const t: Expect<typeof u, User> = true; return u.name; }} />;
const Arrow = <T,>({ items }: { items: T[] }) => <>{items.length}</>;

// len needs a constraint
// @ts-expect-error length not on T
function len<T>(x: T) { return x.length; }
function len2<T extends { length: number }>(x: T) { return x.length; }
len2('abc'); len2([1, 2]);
// @ts-expect-error numbers have no length
len2(5);

// useState(null)
function Comp() {
  const [u, setU] = useState(null);
  const t: Expect<typeof u, null> = true;
  // @ts-expect-error cannot set a User into null state
  setU(users[0]);
  const [u2, setU2] = useState<User | null>(null);
  setU2(users[0]);
  return null;
}
// map infers output
const mapped = [1, 2, 3].map(n => String(n)); const t16: Expect<typeof mapped, string[]> = true;
const pr = Promise.resolve(42); const t17: Expect<typeof pr, Promise<number>> = true;
export {};
const bad: Expect<typeof f1, string> = true;
