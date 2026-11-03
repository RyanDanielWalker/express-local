// Predict-first questions on Narrow Gauge. Each one asserts the type the
// player has to guess, and the guesses a player is likely to type instead.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type User = { name: string };

// ---------------------------------------------------------------------------
// "What is the type of `a` inside the `if`?" (Local) Answer: string.
export function compare(a: string | number, b: string | boolean) {
  if (a === b) {
    const right: Expect<typeof a, string> = true;
    const notUnchanged: Expect<typeof a, string | number> = false;
    const notAll: Expect<typeof a, string | number | boolean> = false;
    // b narrows too.
    const bToo: Expect<typeof b, string> = true;
    return [right, notUnchanged, notAll, bToo];
  } else {
    // Nothing is ruled out when they differ: "a" and "b" are both strings, yet not equal.
    const elseA: Expect<typeof a, string | number> = true;
    return elseA;
  }
}

// ---------------------------------------------------------------------------
// "`strict` is on. What is `name` in the `else`?" (Express) Answer: string | undefined.
export function falsyElse(name: string | undefined) {
  if (name) {
    const inIf: Expect<typeof name, string> = true;
    return inIf;
  } else {
    const right: Expect<typeof name, string | undefined> = true;
    const notUndefined: Expect<typeof name, undefined> = false;
    const notEmptyLiteral: Expect<typeof name, "" | undefined> = false;
    return right && !notUndefined && !notEmptyLiteral;
  }
}
// The empty string really does reach the else.
export function emptyGoesToElse(): string {
  const name: string | undefined = "" as string | undefined;
  if (name) return "if";
  return "else";
}
// A boolean is different: TypeScript can name its falsy value, so it narrows to `false`.
export function boolElse(flag: boolean | undefined) {
  if (!flag) {
    const narrowed: Expect<typeof flag, false | undefined> = true;
    return narrowed;
  }
}

// ---------------------------------------------------------------------------
// "What is `value` inside the `if`?" (Rush Hour) Answer: string.
export function aliased(value: string | number) {
  const isString = typeof value === "string";
  if (isString) {
    const right: Expect<typeof value, string> = true;
    const notUnion: Expect<typeof value, string | number> = false;
    const notBoolean: Expect<typeof value, boolean> = false;
    return [right, notUnion, notBoolean];
  }
}
// It only works with `const`. A `let` could be changed before the `if`.
export function aliasedLet(value: string | number) {
  let isString = typeof value === "string";
  if (isString) {
    const lost: Expect<typeof value, string | number> = true;
    return lost;
  }
  isString = false;
}
// And only if `value` is never assigned to in the function.
export function aliasedReassigned(value: string | number) {
  const isString = typeof value === "string";
  if (isString) {
    const lost: Expect<typeof value, string | number> = true;
    return lost;
  }
  value = 1;
}
// It also works for a discriminant saved in a const.
type Result = { ok: true; data: string } | { ok: false; error: string };
export function aliasedField(result: Result) {
  const isOk = result.ok;
  if (isOk) {
    const narrowed: Expect<typeof result, { ok: true; data: string }> = true;
    return narrowed;
  }
}

// The t2 why's advice: `=== undefined` catches only a missing name, so the empty
// string stays on the other side.
export function onlyMissing(name: string | undefined) {
  if (name === undefined) return;
  const stillString: Expect<typeof name, string> = true;
  return stillString;
}
// A `let` turns it off even if nothing ever changes it: TypeScript does not
// check whether it really changed.
export function aliasedLetUntouched(value: string | number) {
  // eslint-disable-next-line prefer-const
  let isString = typeof value === "string";
  if (isString) {
    const lost: Expect<typeof value, string | number> = true;
    return lost;
  }
}
