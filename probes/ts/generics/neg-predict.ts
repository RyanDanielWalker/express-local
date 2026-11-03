// Should fail: claims the first element's type wins.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
declare function first<T>(items: T[]): T | undefined;
const x = first([1, "a"]);
export const wrong: Expect<typeof x, number | undefined> = true;
