// Should fail: claims comparing two variables does not narrow either one.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function compare(a: string | number, b: string | boolean) {
  if (a === b) {
    const wrong: Expect<typeof a, string | number> = true;
    return wrong;
  }
}
