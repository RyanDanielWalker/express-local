// With `strict` off: no undefined in the state, and an empty array is any[].
import { useState } from "react";
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
export function Profile() {
  const [name] = useState<string>();
  const loose: Expect<typeof name, string> = true;
  const [items] = useState([]);
  const anyItems: IsAny<(typeof items)[number]> = true;
  return <p>{String(loose && anyItems)}</p>;
}
