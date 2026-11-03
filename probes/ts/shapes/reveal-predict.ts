// Prints each answer the way tsc writes it, in an error message.
type Item = { id: string; title: string } | { id: number; done: boolean };
export function show(item: Item) { const show: null = item.id; return show; }
const point: [number, number] = [3, 4];
export const showN: null = point.length;
interface Bag {
  [key: string]: number;
}
declare const k: keyof Bag;
export const showKeys: null = k;
