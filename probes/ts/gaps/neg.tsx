import { createContext, useContext, type ComponentProps } from 'react';
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type User = { id: string; name: string; avatarUrl: string };
declare function isUser(x: unknown): x is User;

// N1 assertion function
function assertUser(x: unknown): asserts x is User { if (!isUser(x)) throw new Error('not a user'); }
async function n1() {
  const data: unknown = await (await fetch('/u')).json();
  assertUser(data);
  const t: Expect<typeof data, User> = true; data.name;
  const r = assertUser(1); const rv: Expect<typeof r, void> = true;
}
// type predicate only narrows inside if
function n1b(x: unknown) { isUser(x);
  // @ts-expect-error still unknown
  x.name; }

// N2 x == null
function n2(x: string | null | undefined, n: number | null | undefined) {
  if (x == null) { const a: Expect<typeof x, null | undefined> = true; } else { const b: Expect<typeof x, string> = true; }
  if (x === null) {} else { const c: Expect<typeof x, string | undefined> = true; }
  if (!n) { const d: Expect<typeof n, number | null | undefined> = true; } // 0 still possible
}
// G1 generic alias
type ApiResponse<T> = { data: T; error: string | null };
declare const res: ApiResponse<User[]>; const g1: Expect<typeof res.data, User> = true;
// G2 default
type Box<T = string> = { value: T };
declare const b: Box; const g2: Expect<typeof b.value, string> = true;
type Box2<T> = { value: T };
// @ts-expect-error needs a type argument
declare const b2: Box2;
// U1 Omit on union
type Shape = { kind: 'circle'; radius: number; id: string } | { kind: 'square'; side: number; id: string };
type NoId = Omit<Shape, 'id'>;
const u1: Expect<NoId, { kind: 'circle' | 'square' }> = true;
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
const u2: Expect<DistOmit<Shape, 'id'>, { kind: 'circle'; radius: number } | { kind: 'square'; side: number }> = true;
function u3(s: NoId) { if (s.kind === 'circle') {
  // @ts-expect-error radius gone
  s.radius; } }
// K1 .catch
declare function fetchUser(): Promise<User>;
fetchUser().catch(err => { const k: IsAny<typeof err> = true; err.message; });
fetchUser().catch((err: unknown) => {
  // @ts-expect-error unknown
  err.message; });
try {} catch (e) { const k2: Expect<typeof e, unknown> = true; }
// R1 context
const UserContext = createContext<User | null>(null);
function Avatar() {
  const user = useContext(UserContext);
  const r1: Expect<typeof user, User | null> = true;
  // @ts-expect-error user might be null
  return <img src={user.avatarUrl} />;
}
// R2 ComponentProps<'button'>
type ButtonProps = ComponentProps<'button'> & { variant: 'primary' | 'ghost' };
function Button({ variant, ...rest }: ButtonProps) { return <button className={variant} {...rest} />; }
const ok = <Button variant="primary" type="submit" disabled aria-label="Save" onClick={e => { const ee: Expect<typeof e.currentTarget, HTMLButtonElement> = true; }} />;
const hasRef: 'ref' extends keyof ComponentProps<'button'> ? true : false = true;
// @ts-expect-error variant is required
const bad = <Button type="submit" />;
