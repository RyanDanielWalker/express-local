/** Random integer in [a, b], inclusive. */
export const rnd = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));

/** Fisher-Yates shuffle, in place. Returns the same array for chaining. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Array of integers from `from` to `to`, inclusive. */
export const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Station label: 0 -> A, 1 -> B, ... */
export const letter = (i: number): string => String.fromCharCode(65 + i);
