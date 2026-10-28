import { LINES } from "../data";
import type { LineId } from "../engine/types";
import type { ScreenKind } from "./modes";

/**
 * Where the app is, as a URL can say it. A line is `/nest/life`. Riding it,
 * from the first question through the results screen, is `/nest/life/ride`,
 * so the browser's Back button leaves a ride for the line it started from.
 *
 * Only which line and which activity go in the URL. A ride's questions and
 * score live in memory, so a ride URL opened fresh shows the line instead.
 */
export type Route =
  | { kind: "home" }
  | { kind: "line"; id: LineId }
  | { kind: "ride"; id: LineId }
  | { kind: "rehearse"; id: LineId }
  | { kind: "drill" };

const divisionOf = (id: LineId) => LINES.find((l) => l.id === id)!.division;

export function pathFor(route: Route): string {
  switch (route.kind) {
    case "home":
      return "/";
    case "drill":
      return "/drill";
    case "line":
      return `/${divisionOf(route.id)}/${route.id}`;
    case "ride":
    case "rehearse":
      return `/${divisionOf(route.id)}/${route.id}/${route.kind}`;
  }
}

/** The route a path names, or null when no page lives there. */
export function parsePath(path: string): Route | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { kind: "home" };
  if (parts.length === 1)
    return parts[0] === "drill" ? { kind: "drill" } : null;
  if (parts.length > 3) return null;

  const [division, id, activity] = parts;
  const line = LINES.find((l) => l.id === id && l.division === division);
  if (!line) return null;
  if (activity === undefined) return { kind: "line", id: line.id };
  if (activity === "ride" || activity === "rehearse")
    return { kind: activity, id: line.id };
  return null;
}

/**
 * The route for what is on screen. `mode` says what a results or derailed
 * screen is the end of: a line, a cram drill or a rehearsal. `home` is true
 * until the player picks a line, so the bare `/` stays bare.
 */
export function screenRoute(
  screen: { kind: ScreenKind; mode?: "line" | "cram" | "rehearsal" },
  id: LineId,
  home: boolean,
): Route {
  switch (screen.kind) {
    case "intro":
      return home ? { kind: "home" } : { kind: "line", id };
    case "cram":
      return { kind: "drill" };
    case "rehearse":
      return { kind: "rehearse", id };
    case "play":
    case "quiz":
    case "result":
    case "derailed":
      if (screen.mode === "cram") return { kind: "drill" };
      if (screen.mode === "rehearsal") return { kind: "rehearse", id };
      return { kind: "ride", id };
  }
}
