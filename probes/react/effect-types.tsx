import { useEffect } from 'react';
function C() {
  // @ts-expect-error an async function returns a Promise, not a cleanup
  useEffect(async () => { await fetch('/u'); }, []);
  return null;
}
export {};
