// Prints each answer the way tsc writes it, in an error message.
export function a(a: string | number, b: string | boolean) {
  if (a === b) { const show: null = a; return show; }
}
export function b(name: string | undefined) {
  if (name) { return 1; } else { const show: null = name; return show; }
}
export function c(value: string | number) {
  const isString = typeof value === "string";
  if (isString) { const show: null = value; return show; }
}
