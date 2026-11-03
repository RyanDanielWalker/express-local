// Predict-first questions on Shape Yard. Each one asserts the type the
// player has to guess, and the guesses a player is likely to type instead.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsNever<T> = [T] extends [never] ? true : false;

// ---------------------------------------------------------------------------
// "What is the type of `id`?" (Local) Answer: string | number.
type Item =
  | { id: string; title: string }
  | { id: number; done: boolean };
export function show(item: Item) {
  const id = item.id;
  const right: Expect<typeof id, string | number> = true;
  const notString: Expect<typeof id, string> = false;
  const notNumber: Expect<typeof id, number> = false;
  // A field only one shape has is an error to read.
  // @ts-expect-error  Property 'title' does not exist on type '{ id: number; done: boolean; }'.
  item.title;
  return [right, notString, notNumber];
}

// ---------------------------------------------------------------------------
// "What is the type of `n`?" (Express) Answer: 2.
const point: [number, number] = [3, 4];
const n = point.length;
export const tRight: Expect<typeof n, 2> = true;
export const tNotNumber: Expect<typeof n, number> = false;
// A plain array does not know its length.
const list: number[] = [3, 4];
const m = list.length;
export const arrayIsNumber: Expect<typeof m, number> = true;
// So assigning another length is an error.
// @ts-expect-error  Type '3' is not assignable to type '2'.
export const three: typeof n = 3;
// An optional slot makes it 1 | 2.
declare const maybe: [number, number?];
export const optional: Expect<typeof maybe.length, 1 | 2> = true;

// ---------------------------------------------------------------------------
// "What is `Keys`?" (Rush Hour) Answer: string | number.
// (The never-from-& fact was dropped as a question: the line's Local `&` question
// already teaches it in its why.)
interface Bag {
  [key: string]: number;
}
type Keys = keyof Bag;
export const kRight: Expect<Keys, string | number> = true;
export const kNotString: Expect<Keys, string> = false;
export const kNotNever: IsNever<Keys> = false;
// Because a number key reads the same property as its string form.
declare const bag: Bag;
const byNumber = bag[0];
export const numberIndexOk: Expect<typeof byNumber, number> = true;
export const sameProperty = { 0: "a" }[0] === { 0: "a" }["0"]; // true when the code runs
// A number index signature gives just number.
interface List {
  [index: number]: string;
}
export const numberOnly: Expect<keyof List, number> = true;
// But keyof a Record<string, ...> is just string: Record is a mapped type, and
// keyof gives back the key type it was built from. So the why speaks only of a
// written index signature, never of Record.
export const recordIsString: Expect<keyof Record<string, number>, string> = true;

// The t1 why's fix: an `in` check narrows to the shape with title.
export function withTitle(item: Item) {
  if ("title" in item) return item.title;
}
// A tuple with a rest element has no fixed length, so the why only speaks of
// tuples with exactly two items.
declare const rest: [number, ...number[]];
export const restLength: Expect<typeof rest.length, number> = true;
