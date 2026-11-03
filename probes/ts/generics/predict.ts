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
