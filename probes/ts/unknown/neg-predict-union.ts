// Should fail: claims string | unknown keeps string usable.
export function parse(input: string | unknown) {
  return input.toUpperCase();
}
