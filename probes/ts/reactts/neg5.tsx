// Should fail: the element type itself is not a ref, so <input ref> rejects it.
function MyInput({ ref }: { ref?: HTMLInputElement }) { return <input ref={ref} />; }
export const x = <MyInput />;
