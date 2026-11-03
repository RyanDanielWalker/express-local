// With `strict` off, the optional parameter reads as plain number.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function move(x: number, y?: number) {
  return [x, y];
}
export const loose: Expect<Parameters<typeof move>[1], number> = true;
type Settings = { theme: string; fontSize?: number };
export function plain(settings: Settings) {
  const size = settings.fontSize;
  const alsoNumber: Expect<typeof size, number> = true;
  return alsoNumber;
}
