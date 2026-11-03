// Should fail: claims Promise.all gives a plain array of a union.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { name: string };
declare function getUser(): Promise<User>;
declare function getCount(): Promise<number>;
const results = await Promise.all([getUser(), getCount()]);
export const wrong: Expect<typeof results, (User | number)[]> = true;
