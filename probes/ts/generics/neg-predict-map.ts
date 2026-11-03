// Should fail: claims get() returns just the value type once it was set.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
const scores = new Map<string, number>();
scores.set("ann", 10);
const n = scores.get("ann");
export const wrong: Expect<typeof n, number> = true;
