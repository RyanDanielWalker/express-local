// With `strict` off, the undefined drops out of an optional chain's type.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { name: string };
export function label(user: User | undefined) {
  const name = user?.name;
  const loose: Expect<typeof name, string> = true;
  return loose;
}
