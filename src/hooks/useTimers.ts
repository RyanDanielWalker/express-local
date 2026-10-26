import { useCallback, useEffect, useRef } from "react";

/** setTimeout that cleans up after itself when the component unmounts. */
export function useTimers() {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((id) => clearTimeout(id)), []);
  return useCallback((fn: () => void, ms: number) => {
    ids.current.push(window.setTimeout(fn, ms));
  }, []);
}
