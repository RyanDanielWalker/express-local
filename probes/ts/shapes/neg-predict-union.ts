// Should fail: claims reading a shared field on a union gives only the first shape's type.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type Item = { id: string; title: string } | { id: number; done: boolean };
export function show(item: Item) {
  const wrong: Expect<typeof item.id, string> = true;
  return wrong;
}
