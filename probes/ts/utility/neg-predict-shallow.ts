// Should fail: claims Partial reaches nested objects.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { name: string; address: { city: string } };
export function update(patch: Partial<User>) {
  if (patch.address) {
    const wrong: Expect<typeof patch.address.city, string | undefined> = true;
    return wrong;
  }
}
