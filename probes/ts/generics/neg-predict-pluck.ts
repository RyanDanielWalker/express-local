// Should fail: claims pluck keeps each key's position, as a tuple.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
declare function pluck<T, K extends keyof T>(obj: T, keys: K[]): T[K][];
const user = { id: "1", age: 38 };
const values = pluck(user, ["id", "age"]);
export const wrong: Expect<typeof values, [string, number]> = true;
