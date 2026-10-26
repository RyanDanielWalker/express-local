import { useEffect, useRef } from "react";

/** Global keyboard shortcuts. Ignores keys pressed with Cmd/Ctrl or while typing in a field. */
export function useKeys(handler: (e: KeyboardEvent) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      ref.current(e);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
