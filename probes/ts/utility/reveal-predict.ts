// Prints each answer the way tsc writes it, in an error message.
type Settings = { theme: string; fontSize?: number };
export function apply(settings: Required<Settings>) { const show: null = settings.fontSize; return show; }
export function move(x: number, y?: number) { return [x, y]; }
declare const y: Parameters<typeof move>[1];
export const showY: null = y;
type User = { name: string; address: { city: string } };
export function update(patch: Partial<User>) {
  if (patch.address) { const show: null = patch.address.city; return show; }
}
declare const ps: Parameters<typeof move>;
export const showParams: null = ps;
