// The same call with `strict` off: `undefined` is dropped from the type.
// This is why the question says "`strict` is on".
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
declare function first<T>(items: T[]): T | undefined;
const x = first([1, "a"]);
export const loose: Expect<typeof x, string | number> = true;

// Map.get with `strict` off: the undefined drops out too.
const scores = new Map<string, number>();
const n = scores.get("ann");
export const mapLoose: Expect<typeof n, number> = true;
