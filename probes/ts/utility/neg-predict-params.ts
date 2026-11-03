// Should fail: claims an optional parameter reads as plain number.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function move(x: number, y?: number) { return [x, y]; }
export const wrong: Expect<Parameters<typeof move>[1], number> = true;
