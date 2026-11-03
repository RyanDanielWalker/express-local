// Should fail: claims useState<string>() gives plain string.
import { useState } from "react";
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function Profile() {
  const [name] = useState<string>();
  const wrong: Expect<typeof name, string> = true;
  return <p>{String(wrong)}</p>;
}
