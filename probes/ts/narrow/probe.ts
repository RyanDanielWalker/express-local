type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
declare function is<T>(v: T): T;

// Q: input instanceof Object on string | string[]
function a1(input: string | string[]) {
  if (input instanceof Object) { const t: Expect<typeof input, string[]> = true; }
}
function a2(input: string | string[]) {
  if (typeof input === 'object') { const t: Expect<typeof input, string[]> = true; }
}
// Q: typeof === 'array' is flagged
function a3(input: string | string[]) {
  // @ts-expect-error should be flagged as no overlap
  if (typeof input === 'array') {}
}
// Q: typeof object with null
function b(value: object | null | string) {
  if (typeof value === 'object') { const t: Expect<typeof value, object | null> = true; }
}
// Q: filter inferred predicate
const ids = [1, undefined, 3].filter(x => x !== undefined);
const c: Expect<typeof ids, number[]> = true;
// Q: inferred predicate from `in`, no annotation
type Cat = { meow(): void }; type Dog = { bark(): void }; type Pet = Cat | Dog;
function isCat(pet: Pet) { return 'meow' in pet; }
function d(p: Pet) { if (isCat(p)) { const t: Expect<typeof p, Cat> = true; } }
// Q: closure loses property narrowing
declare function later(f: () => void): void;
function e(obj: { user?: { name: string } }) {
  if (obj.user) {
    // @ts-expect-error narrowing lost in callback
    later(() => obj.user.name);
    const u = obj.user; later(() => u.name);
  }
}
// Sort: never branch
function f(value: string | number) {
  if (typeof value === 'boolean') { const t: Expect<typeof value, never> = true; }
  if (typeof value !== 'string') { const t: Expect<typeof value, number> = true; }
}
// Sort: in narrowing Admin / Guest
type Admin = { name: string; permissions: string[] }; type Guest = { name: string };
function g(user: Admin | Guest) { if ('permissions' in user) { const t: Expect<typeof user, Admin> = true; } }
// catch variable is unknown under strict
async function h() { try { await Promise.resolve(); } catch (err) { const t: Expect<typeof err, unknown> = true; if (err instanceof Error) { const s: Expect<typeof err, Error> = true; } } }
// truthiness narrows out undefined
function k(count: number | undefined) { if (count) { const t: Expect<typeof count, number> = true; } }
export {};
function isCatB(pet: Pet): boolean { return 'meow' in pet; }
function m(p: Pet) { if (isCatB(p)) { const t: Expect<typeof p, Pet> = true; } }
function n2(input: string | string[]) { if (input.length > 0) { const t: Expect<typeof input, string | string[]> = true; } }
function fl(x: boolean | (() => void)) { if (typeof x === 'function') { const t: Expect<typeof x, () => void> = true; } }
type Result = { ok: true; data: string } | { ok: false; error: string };
function r(result: Result) {
  // @ts-expect-error data cannot be read before narrowing
  result.data;
  if (result.ok) { const t: Expect<typeof result.data, string> = true; }
}
const ids2 = [1, undefined, 3].filter((x): x is number => x !== undefined);
const c2: Expect<typeof ids2, number[]> = true;
function cnt(count: number | undefined) { if (count !== undefined) { const t: Expect<typeof count, number> = true; } }
function shape(s: { kind: 'circle'; radius: number } | { kind: 'square'; side: number }) {
  switch (s.kind) { case 'circle': { s.radius;
    // @ts-expect-error no side on a circle
    s.side; } }
}
