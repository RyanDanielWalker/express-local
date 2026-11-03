// Should fail: claims optional chaining gives plain string.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { name: string };
export function label(user: User | undefined) {
  const name = user?.name;
  const wrong: Expect<typeof name, string> = true;
  return wrong;
}
