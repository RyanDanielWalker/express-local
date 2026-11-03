// The same check with `strict` off: without strictNullChecks, `undefined` is
// not part of the type at all. This is why the question says "`strict` is on".
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function falsyElse(name: string | undefined) {
  if (!name) {
    const loose: Expect<typeof name, string> = true;
    return loose;
  }
}
