// Predict-first questions on Generic Line. Each one asserts the type the
// player has to guess, and the guesses a player is likely to type instead.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;

declare function first<T>(items: T[]): T | undefined;

// "`strict` is on. What is the type of `x`?" Answer: string | number | undefined.
// (predict-loose.ts shows `strict` matters: without it, undefined is dropped.)
const x = first([1, "a"]);
export const right: Expect<typeof x, string | number | undefined> = true;
// The union order in the guess does not matter to TypeScript either.
export const anyOrder: Expect<typeof x, undefined | number | string> = true;

// Tempting guesses that are wrong.
export const notFirstElement: Expect<typeof x, number | undefined> = false;
export const notLiterals: Expect<typeof x, 1 | "a" | undefined> = false;
export const notWithoutUndefined: Expect<typeof x, string | number> = false;
export const notUnknown: Expect<typeof x, unknown> = false;

// T itself is the union: the array is read as one (string | number)[].
declare function only<T>(items: T[]): T;
const t = only([1, "a"]);
export const tIsUnion: Expect<typeof t, string | number> = true;
// Widened here. The why says only that, and how to keep the exact values,
// because the general rule is subtle: a bare argument stays exact, and a
// readonly array still widens. Both are asserted below so nobody "simplifies"
// the why into a rule that breaks on them.
export const notLiteralT: Expect<typeof t, 1 | "a"> = false;
declare function firstConst<const T>(items: T[]): T | undefined;
const exact = firstConst([1, "a"]);
export const constKeeps: Expect<typeof exact, 1 | "a" | undefined> = true;
declare function firstRO<T>(items: readonly T[]): T | undefined;
const ro = firstRO([1, "a"]);
export const readonlyWidens: Expect<typeof ro, string | number | undefined> = true;
declare function firstOne<T>(item: T): T | undefined;
const one = firstOne(1);
export const bareStaysExact: Expect<typeof one, 1 | undefined> = true;
const inArray = first([1]);
export const itemWidens: Expect<typeof inArray, number | undefined> = true;
// Every element counts, not just the first.
const later = first([1, 2, "a"]);
export const thirdCounts: Expect<typeof later, string | number | undefined> = true;

// Two separate arguments behave differently: T is fixed by the first one (as the literal 1),
// and the second is an error. This is where the guess of `number` comes from.
declare function both<T>(a: T, b: T): T;
// @ts-expect-error  Argument of type '"a"' is not assignable to parameter of type '1'.
both(1, "a");

// ---------------------------------------------------------------------------
// "`strict` is on. What is the type of `n`?" (Local) Answer: number | undefined.
// Map's own declaration: get(key: K): V | undefined. predict-loose.ts shows
// that with `strict` off, the undefined drops out.
const scores = new Map<string, number>();
scores.set("ann", 10);
const n = scores.get("ann");
export const mapRight: Expect<typeof n, number | undefined> = true;
export const mapNotNumber: Expect<typeof n, number> = false;
export const mapNotNull: Expect<typeof n, number | null> = false;
// Expect cannot tell `any` apart (it is assignable both ways), so check it directly.
type IsAny<T> = 0 extends 1 & T ? true : false;
export const mapNotAny: IsAny<typeof n> = false;
export const mapNotKeyAndValue: Expect<typeof n, string | number | undefined> = false;
// TypeScript does not track what was set. Even a has() check does not help.
export function afterHas() {
  if (scores.has("ann")) {
    const v = scores.get("ann");
    const stillMaybe: Expect<typeof v, number | undefined> = true;
    return stillMaybe;
  }
}
// So the why's "set() first does not change it" holds: a fresh map gives the same type.
const fresh = new Map<string, number>();
const n2 = fresh.get("ann");
export const sameWithoutSet: Expect<typeof n2, typeof n> = true;

// ---------------------------------------------------------------------------
// "What is the type of `results`?" (Express) Answer: [User, number].
type User = { name: string };
declare function getUser(): Promise<User>;
declare function getCount(): Promise<number>;
const results = await Promise.all([getUser(), getCount()]);
export const allRight: Expect<typeof results, [User, number]> = true;
export const allNotArray: Expect<typeof results, (User | number)[]> = false;
export const allNotPromises: Expect<typeof results, [Promise<User>, Promise<number>]> = false;
export const allNotPromiseOfTuple: Expect<typeof results, Promise<[User, number]>> = false;
export const allNotReadonly: Expect<typeof results, readonly [User, number]> = false;
// So each position keeps its own type.
const [u, c] = results;
export const firstIsUser: Expect<typeof u, User> = true;
export const secondIsNumber: Expect<typeof c, number> = true;
// Why: the `| []` in Promise.all's constraint makes TypeScript read an array
// literal as a tuple. The same signature without it gives a plain array.
declare function asTuple<T extends readonly unknown[] | []>(values: T): T;
declare function asArray<T extends readonly unknown[]>(values: T): T;
const tup = asTuple([1, "a"]);
const arr = asArray([1, "a"]);
export const withEmptyTupleIsTuple: Expect<typeof tup, [number, string]> = true;
export const withoutIsArray: Expect<typeof arr, (string | number)[]> = true;
// Put the promises in a variable first, and the positions are gone.
const pending = [getUser(), getCount()];
const lost = await Promise.all(pending);
export const variableLosesPositions: Expect<typeof lost, (User | number)[]> = true;
// Only a plain array variable loses them. `as const` or a tuple type keeps them,
// so the why names the plain `const list = [...]` case, not "any variable".
const pendingConst = [getUser(), getCount()] as const;
const kept = await Promise.all(pendingConst);
export const asConstKeeps: Expect<typeof kept, [User, number]> = true;
const pendingTuple: [Promise<User>, Promise<number>] = [getUser(), getCount()];
const keptToo = await Promise.all(pendingTuple);
export const tupleTypeKeeps: Expect<typeof keptToo, [User, number]> = true;

// ---------------------------------------------------------------------------
// "What is the type of `values`?" (Rush Hour) Answer: (string | number)[].
declare function pluck<T, K extends keyof T>(obj: T, keys: K[]): T[K][];
const user = { id: "1", age: 38 };
const values = pluck(user, ["id", "age"]);
export const pluckRight: Expect<typeof values, (string | number)[]> = true;
export const pluckSameAsArrayOf: Expect<typeof values, Array<number | string>> = true;
export const pluckNotTuple: Expect<typeof values, [string, number]> = false;
export const pluckNotKeys: Expect<typeof values, ("id" | "age")[]> = false;
export const pluckNotStrings: Expect<typeof values, string[]> = false;
export const pluckNotUnknown: Expect<typeof values, unknown[]> = false;
export const pluckNotOneOrOther: Expect<typeof values, string[] | number[]> = false;
// K is the union of the two keys, and T[K] with a union key is the union of their values.
declare function keysOf<T, K extends keyof T>(obj: T, keys: K[]): K;
const k = keysOf(user, ["id", "age"]);
export const kIsUnion: Expect<typeof k, "id" | "age"> = true;
export const indexedByUnion: Expect<(typeof user)["id" | "age"], string | number> = true;
// One key gives that key's value type: the existing `get` question's fact, not this one.
const justAge = pluck(user, ["age"]);
export const oneKey: Expect<typeof justAge, number[]> = true;
// Reversing the keys gives the same type: the order is not recorded.
const reversed = pluck(user, ["age", "id"]);
export const orderIgnored: Expect<typeof reversed, typeof values> = true;
