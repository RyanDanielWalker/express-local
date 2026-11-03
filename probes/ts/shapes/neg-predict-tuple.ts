// Should fail: claims a tuple's length is plain number.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
const point: [number, number] = [3, 4];
export const wrong: Expect<typeof point.length, number> = true;
