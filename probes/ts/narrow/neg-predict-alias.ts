// Should fail: claims a check saved in a const does not narrow.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function f(value: string | number) {
  const isString = typeof value === "string";
  if (isString) {
    const wrong: Expect<typeof value, string | number> = true;
    return wrong;
  }
}
