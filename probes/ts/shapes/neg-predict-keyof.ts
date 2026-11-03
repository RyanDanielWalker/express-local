// Should fail: claims keyof a string index signature is just string.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
interface Bag {
  [key: string]: number;
}
export const wrong: Expect<keyof Bag, string> = true;
