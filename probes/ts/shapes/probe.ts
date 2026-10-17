type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
interface Point { x: number; y: number }

// through a variable: fine; literal: excess error
const loose = { x: 1, y: 2, z: 3 };
const a: Point = loose;
// @ts-expect-error excess property on a literal
const b: Point = { x: 1, y: 2, z: 3 };
// @ts-expect-error missing y
const c: Point = { x: 1 };
// @ts-expect-error wrong type
const d: Point = { x: 1, y: '2' };
class Vector { constructor(public x: number, public y: number) {} length() { return 0; } }
const e: Point = new Vector(1, 2);   // no implements needed

// call-site excess check
function render(props: { onClick: () => void }) {}
// @ts-expect-error excess at a call site
render({ onClick: () => {}, onHover: () => {} });
const handlers = { onClick: () => {}, onHover: () => {} };
render(handlers);

// optional vs undefined
type A = { name?: string };
type B = { name: string | undefined };
const a1: A = {};
// @ts-expect-error B requires the key
const b1: B = {};
const b2: B = { name: undefined };
declare const aa: A; const an = aa.name; const t1: Expect<typeof an, string | undefined> = true;
// @ts-expect-error A does not allow null
const a2: A = { name: null };

// readonly is shallow
interface Props { readonly items: string[] }
declare const props: Props;
// @ts-expect-error cannot reassign
props.items = [];
props.items.push('x');
interface Props2 { readonly items: readonly string[] }
declare const props2: Props2;
// @ts-expect-error readonly array has no push
props2.items.push('x');

// index signature lets typos through
interface Bag { [key: string]: string }
declare const bag: Bag; const typo = bag.nmae; const t2: Expect<typeof typo, string> = true;
declare const rec: Record<'name' | 'email', string>;
// @ts-expect-error typo caught with a key union
rec.nmae;

// identical interfaces are assignable
interface UserA { id: string } interface UserB { id: string }
declare const ua: UserA; const ub: UserB = ua;

// branded types
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };
declare const oid: OrderId;
// @ts-expect-error OrderId is not a UserId
const uid: UserId = oid;
// @ts-expect-error plain string is not a UserId
const uid2: UserId = 'abc';
const uid3 = 'abc' as UserId;

// discriminated union props
type Fetch = { status: 'loading' } | { status: 'done'; data: string };
declare const f: Fetch;
// @ts-expect-error data not available until narrowed
f.data;
if (f.status === 'done') f.data;

// unions only with type; interface cannot be a union
type Result = { ok: true } | { ok: false };
// mapped type only with type
type Flags = { [K in 'a' | 'b']: boolean };
// tuple with type
type Pair = [number, string];
// function signature both ways
type Fn1 = (x: number) => string; interface Fn2 { (x: number): string }
const fn: Fn2 = (x: number) => String(x); const fn1: Fn1 = fn;

// extends and &
interface User { id: string; name: string }
interface Admin extends User { role: string }
type Admin2 = User & { role: string };
const ad: Admin = { id: '1', name: 'a', role: 'r' }; const ad2: Admin2 = ad; const ad3: Admin = ad2;

// declaration merging
interface Merged { a: string }
interface Merged { b: number }
const m: Merged = { a: 'x', b: 1 };
// @ts-expect-error merged interface needs both
const m2: Merged = { a: 'x' };
export {};
