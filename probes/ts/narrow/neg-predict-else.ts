// Should fail: claims only undefined reaches the else.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function f(name: string | undefined) {
  if (name) return;
  const wrong: Expect<typeof name, undefined> = true;
  return wrong;
}
