// Should fail: a RefObject<HTMLInputElement> prop rejects useRef<HTMLInputElement>(null), whose current can be null.
import { useRef, type RefObject } from 'react';
function ObjInput({ ref }: { ref?: RefObject<HTMLInputElement> }) { return <input ref={ref} />; }
export function Uses() { const r = useRef<HTMLInputElement>(null); return <ObjInput ref={r} />; }
