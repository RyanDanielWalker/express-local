// Should fail: claims e.target in a button's onClick is the button.
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
export function Save() {
  return (
    <button
      onClick={(e) => {
        const wrong: Expect<typeof e.target, HTMLButtonElement> = true;
        return wrong;
      }}
    >
      Save
    </button>
  );
}
