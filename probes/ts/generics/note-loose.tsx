// Why the note says "with strict on": with strict off, useState(null) is any, not null.
import { useState } from 'react';
type IsAny<T> = 0 extends 1 & T ? true : false;
export function Profile() {
  const [u, setUser] = useState(null);
  const loose: IsAny<typeof u> = true;
  setUser({ id: 'a', name: 'Ann' }); // no error with strict off
  return null;
}
