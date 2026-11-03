// Should fail: claims Array.isArray narrows unknown to unknown[], so items need checking.
export function count(value: unknown) {
  if (Array.isArray(value)) {
    // @ts-expect-error  (unused: with any[] this line has no error, so this fails)
    value[0].foo.bar();
  }
}
