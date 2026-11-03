// Predict-first questions on Unknown Territory. Each one asserts the type the
// player has to guess, and the guesses a player is likely to type instead.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? true : false;

// ---------------------------------------------------------------------------
// "`strict` is on. What is the type of `name`?" (Local) Answer: string | undefined.
type User = { name: string };
export function label(user: User | undefined) {
  const name = user?.name;
  const right: Expect<typeof name, string | undefined> = true;
  const notString: Expect<typeof name, string> = false;
  const notNull: Expect<typeof name, string | null> = false;
  return [right, notString, notNull];
}
// It is undefined, not null, even when user is null.
export function fromNull(user: User | null) {
  const name = user?.name;
  const stillUndefined: Expect<typeof name, string | undefined> = true;
  return stillUndefined;
}
export const atRuntime = (null as User | null)?.name; // undefined when the code runs

// ---------------------------------------------------------------------------
// "What is `value` inside the `if`?" (Express) Answer: any[].
export function count(value: unknown) {
  if (Array.isArray(value)) {
    const right: Expect<typeof value, any[]> = true;
    // Expect cannot tell any[] from unknown[] (any fits both ways), so check the item type.
    const itemIsAny: IsAny<(typeof value)[number]> = true;
    // So this compiles, unchecked:
    value[0].foo.bar();
    return [right, itemIsAny];
  }
}

// ---------------------------------------------------------------------------
// "What is the type of `input`?" (Rush Hour) Answer: unknown.
export function parse(input: string | unknown) {
  const right: IsUnknown<typeof input> = true;
  const notAny: IsAny<typeof input> = false;
  // Expect<unknown, string | unknown> is trivially true, so prove the union collapsed:
  const notJustString: Expect<typeof input, string> = false;
  return [right, notAny, notJustString];
}
type Collapsed = string | unknown;
export const collapsed: IsUnknown<Collapsed> = true;
// The why's other cases: any swallows a union too, and never disappears from one.
export const anyWins: IsAny<string | any> = true;
export const neverGone: Expect<string | never, string> = true;
// Still unknown, so you cannot use it as a string without a check.
export function use(input: string | unknown) {
  // @ts-expect-error  'input' is of type 'unknown'.
  input.toUpperCase();
}

// The Array.isArray why's fix: assign to unknown[] right after the check, and
// items need checking again.
export function safer(value: unknown) {
  if (Array.isArray(value)) {
    const items: unknown[] = value;
    // @ts-expect-error  'items[0]' is of type 'unknown'.
    items[0].foo;
    return items;
  }
}
// The union why: a typeof check gets the string back, and any beats unknown.
export function checked(input: string | unknown) {
  if (typeof input === "string") return input.toUpperCase();
}
export const anyBeatsUnknown: IsAny<unknown | any> = true;

// The `string | string[]` case on the line keeps its item type: only an
// `unknown` (or `any`) value comes out as any[].
export function keepsItems(input: string | string[]) {
  if (Array.isArray(input)) {
    const kept: Expect<typeof input, string[]> = true;
    return kept;
  }
}
// "its items are not checked": the array itself still is.
export function arrayStillChecked(value: unknown) {
  if (Array.isArray(value)) {
    // @ts-expect-error  Property 'foo' does not exist on type 'any[]'.
    return value.foo;
  }
}
