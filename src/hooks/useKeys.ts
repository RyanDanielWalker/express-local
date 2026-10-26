import { useEffect, useEffectEvent } from "react";

/** Global keyboard shortcuts. Ignores keys pressed with Cmd/Ctrl or while typing in a field. */
export function useKeys(handler: (e: KeyboardEvent) => void) {
  // An Effect Event always calls the latest handler, so the listener is
  // added once instead of on every render.
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    handler(e);
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onKeyDown(e);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
