// Should fail: without as const, toggle is boolean | (() => void), so calling it is an error.
import { useState } from 'react';
function useToggle() {
  const [on, setOn] = useState(false);
  const toggle = () => setOn(o => !o);
  return [on, toggle];
}
export function Uses() { const [, toggle] = useToggle(); toggle(); return null; }
