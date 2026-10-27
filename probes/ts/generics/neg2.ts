// Should fail: pair('id', 42) is [string, number], so the second slot is not a string.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }
const pr = pair('id', 42);
export const wrong: Expect<typeof pr, [string, string]> = true;
