// Predict-first questions on Utility Yard. Each one asserts the type the
// player has to guess, and the guesses a player is likely to type instead.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

// ---------------------------------------------------------------------------
// "`strict` is on. What is the type of `size`?" (Local) Answer: number.
type Settings = { theme: string; fontSize?: number };
export function apply(settings: Required<Settings>) {
  const size = settings.fontSize;
  const right: Expect<typeof size, number> = true;
  const notMaybe: Expect<typeof size, number | undefined> = false;
  return [right, notMaybe];
}
// Without Required, the same read is number | undefined.
export function plain(settings: Settings) {
  const size = settings.fontSize;
  const maybe: Expect<typeof size, number | undefined> = true;
  return maybe;
}
// Required makes the key required too: leaving it out is an error.
// @ts-expect-error  Property 'fontSize' is missing.
export const missing: Required<Settings> = { theme: "dark" };

// ---------------------------------------------------------------------------
// "`strict` is on. What is `Y`?" (Express) Answer: number | undefined.
export function move(x: number, y?: number) {
  return [x, y];
}
type Y = Parameters<typeof move>[1];
export const pRight: Expect<Y, number | undefined> = true;
export const pNotNumber: Expect<Y, number> = false;
export const pNotTuple: Expect<Y, [number, number]> = false;
// Parameters is the whole list, as a tuple. [1] reads the second slot.
export const pTuple: Expect<Parameters<typeof move>, [x: number, y?: number]> = true;
export const pFirst: Expect<Parameters<typeof move>[0], number> = true;

// ---------------------------------------------------------------------------
// "What is the type of `city`?" (Rush Hour) Answer: string.
type User = { name: string; address: { city: string } };
export function update(patch: Partial<User>) {
  if (patch.address) {
    const city = patch.address.city;
    const right: Expect<typeof city, string> = true;
    const notMaybe: Expect<typeof city, string | undefined> = false;
    const notAny: IsAny<typeof city> = false;
    return [right, notMaybe, notAny];
  }
}
// Shallow: only the top level is optional. A nested object still needs every field.
// @ts-expect-error  Property 'city' is missing.
export const half: Partial<User> = { address: {} };
export const top: Expect<Partial<User>["address"], { city: string } | undefined> = true;
