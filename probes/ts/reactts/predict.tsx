// Predict-first questions on Typed Components, against @types/react 19.3.
// Each one asserts the type the player has to guess, and the guesses a player
// is likely to type instead.
import { useState } from "react";
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type User = { id: string; name: string };

// ---------------------------------------------------------------------------
// "`strict` is on. What is the type of `name`?" (Local) Answer: string | undefined.
export function Profile() {
  const [name, setName] = useState<string>();
  const right: Expect<typeof name, string | undefined> = true;
  const notString: Expect<typeof name, string> = false;
  setName(undefined); // the setter takes undefined too
  setName("Ann");
  return <p>{String(right && !notString)}</p>;
}
// With an initial value, undefined is not added.
export function WithStart() {
  const [name] = useState<string>("");
  const plain: Expect<typeof name, string> = true;
  return <p>{String(plain)}</p>;
}

// ---------------------------------------------------------------------------
// "`strict` is on. What is the type of `items`?" (Express) Answer: never[].
export function List() {
  const [items, setItems] = useState([]);
  const right: Expect<typeof items, never[]> = true;
  const notAny: IsAny<(typeof items)[number]> = false;
  const notUnknown: Expect<typeof items, unknown[]> = false;
  const user: User = { id: "1", name: "Ann" };
  // So nothing can be added.
  // @ts-expect-error  Type 'User' is not assignable to type 'never'.
  setItems([user]);
  return <p>{String(right && !notAny && !notUnknown)}</p>;
}
// The fix: say what goes in it.
export function TypedList() {
  const [items, setItems] = useState<User[]>([]);
  setItems([{ id: "1", name: "Ann" }]);
  const ok: Expect<typeof items, User[]> = true;
  return <p>{String(ok)}</p>;
}

// ---------------------------------------------------------------------------
// "What is the type of `el`?" (Rush Hour) Answer: EventTarget.
export function Save() {
  return (
    <button
      onClick={(e) => {
        const el = e.target;
        const right: Expect<typeof el, EventTarget> = true;
        const notButton: Expect<typeof el, HTMLButtonElement> = false;
        const notIntersection: Expect<typeof el, EventTarget & HTMLButtonElement> = false;
        // currentTarget is the element the handler is on.
        const cur = e.currentTarget;
        const current: Expect<typeof cur, EventTarget & HTMLButtonElement> = true;
        // So button-only fields need currentTarget.
        // @ts-expect-error  Property 'disabled' does not exist on type 'EventTarget'.
        el.disabled;
        cur.disabled;
        return [right, notButton, notIntersection, current];
      }}
    >
      <span>Save</span>
    </button>
  );
}
// An input's onChange is different: its target is typed as the input.
export function Field() {
  return (
    <input
      onChange={(e) => {
        const t = e.target;
        const typed: Expect<typeof t, EventTarget & HTMLInputElement> = true;
        return typed;
      }}
    />
  );
}

// The type does not depend on the span: a button with only text gives the same.
export function SaveText() {
  return (
    <button
      onClick={(e) => {
        const el = e.target;
        const same: Expect<typeof el, EventTarget> = true;
        return same;
      }}
    >
      Save
    </button>
  );
}
