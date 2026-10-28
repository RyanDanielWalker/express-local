import { useEffect, useEffectEvent, useRef, useState } from "react";

// The app's own paths start after Vite's base, so a deploy under a subfolder
// still reads `/nest/life`.
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** The address bar's path, without the base. */
export const currentPath = () =>
  window.location.pathname.slice(base.length) || "/";

/**
 * Keeps the address bar on `path`, and hands Back and Forward to `onPop`.
 *
 * A new path normally gets a new history entry, which remembers the page it
 * was opened from. Leaving a page for that one goes back instead of pushing.
 * So "Back to the map" mid-ride does not leave the ride behind it in history,
 * and Forward onto a ride that no longer exists steps straight back off it.
 *
 * The first render replaces the entry instead, so a bad or stale URL gets
 * fixed in place. So does any other fix after Back or Forward, since pushing
 * then would cut off the player's Forward history.
 */
export function useUrl(
  path: string,
  title: string,
  onPop: (path: string) => void,
) {
  const first = useRef(true);
  const replace = useRef(true);
  // Bumped on every Back or Forward, so the sync below runs even when the
  // app's path did not change but the address bar did.
  const [pops, setPops] = useState(0);

  useEffect(() => {
    const here = currentPath();
    if (path !== here) {
      const state = window.history.state as { from?: string } | null;
      if (!first.current && state?.from === path) window.history.back();
      else if (replace.current)
        window.history.replaceState(null, "", base + path);
      else window.history.pushState({ from: here }, "", base + path);
    }
    first.current = false;
    replace.current = false;
  }, [path, pops]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  const popped = useEffectEvent(() => {
    replace.current = true;
    setPops((n) => n + 1);
    onPop(currentPath());
  });
  useEffect(() => {
    const onPopState = () => popped();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
}
