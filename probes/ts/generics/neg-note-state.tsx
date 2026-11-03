// Should fail: claims useState(null) already allows a User later.
import { useState } from 'react';
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { id: string; name: string };
export function Profile() {
  const [u] = useState(null);
  const wrong: Expect<typeof u, User | null> = true;
  return null;
}
