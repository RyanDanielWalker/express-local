// Should fail: claims Required leaves the undefined in.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
type Settings = { theme: string; fontSize?: number };
export function apply(settings: Required<Settings>) {
  const wrong: Expect<typeof settings.fontSize, number | undefined> = true;
  return wrong;
}
