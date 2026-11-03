// The "Can TypeScript work out the type" sort puzzle's note (src/data/typescript.ts).
import { useState } from 'react';
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type User = { id: string; name: string };
declare const user: User;

// "TypeScript works out the type from the arguments you pass."
const fromArgs = new Set([1, 2]); const n1: Expect<typeof fromArgs, Set<number>> = true;

// "An empty Map becomes Map<any, any>, so TypeScript stops checking its keys and values."
const m = new Map();
const n2: IsAny<ReturnType<typeof m.get>> = true; // any comes out
const n2b: Expect<typeof m, Map<any, any>> = true; // can't tell any from unknown on its own; n2 and n2c can
m.forEach((v, k) => { const n2c: IsAny<typeof k> = true; const n2d: IsAny<typeof v> = true; }); // keys and values both any
// Only keys and values: the Map itself is still checked.
// @ts-expect-error a misspelled method is still an error
m.sett(1, 2);
// @ts-expect-error a missing argument is still an error
m.set(1);
m.set(1, 'x'); m.set('k', { anything: true }); // anything goes in, no error
m.get('k').whatever.deep; // any: no error here, even though this crashes at runtime

// "An empty Set becomes Set<unknown>, so you have to check each item before you use it."
const s = new Set();
const n3a: Expect<typeof s, Set<unknown>> = true;
s.forEach((item) => {
  const n3: Expect<typeof item, unknown> = true; const n4: IsAny<typeof item> = false;
  // @ts-expect-error an unknown item must be checked before use
  item.toUpperCase();
  if (typeof item === 'string') item.toUpperCase(); // fine once checked
});

// Talking point: "An empty Map gives Map<any, any>, and with strict on, useState(null) gives just null."
// (Map: n2 to n2d above. useState: n5 below.)

// "Unlike the empty collections, useState(null) gives TypeScript a value to infer from. With strict on, the state's
// type is just null, so setting a real user is an error."
function Profile() {
  const [u, setUser] = useState(null);
  const n5: Expect<typeof u, null> = true;
  const n6: IsAny<typeof u> = false;
  // @ts-expect-error a User does not fit state typed as just null
  setUser(user);
  return null;
}

// "In all three cases, write the type yourself."
function Fixed() {
  const [u, setUser] = useState<User | null>(null);
  setUser(user);
  const n7: Expect<typeof u, User | null> = true;
  const byId = new Map<string, User>(); const got = byId.get('a'); const n8: Expect<typeof got, User | undefined> = true;
  const ids = new Set<number>(); ids.add(1);
  // @ts-expect-error a typed Set checks what goes in
  ids.add('1');
  return null;
}
export { Profile, Fixed };
