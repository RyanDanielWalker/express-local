// Should fail: after id = 42, id is number, not string | number.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
let id: string | number = 'a1';
id = 42;
export const wrong: Expect<typeof id, string | number> = true;
