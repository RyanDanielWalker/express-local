// Prints each answer the way tsc writes it, in an error message.
type User = { name: string };
export function label(user: User | undefined) { const show: null = user?.name; return show; }
export function count(value: unknown) {
  if (Array.isArray(value)) { const show: null = value; return show; }
}
export function parse(input: string | unknown) { const show: null = input; return show; }
