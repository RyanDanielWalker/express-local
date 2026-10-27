// Should fail: a RefObject<HTMLInputElement> prop rejects a callback ref.
import type { RefObject } from 'react';
function ObjInput({ ref }: { ref?: RefObject<HTMLInputElement> }) { return <input ref={ref} />; }
export const x = <ObjInput ref={el => { el?.focus(); }} />;
