// Should fail: claims TypeScript still checks what goes into an empty Map.
const m = new Map();
// @ts-expect-error (wrong: nothing is checked, so this directive is unused)
m.set(1, 'x');
export {};
