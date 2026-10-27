/** Every screen the app can show. Each kind in `App.tsx`'s `Screen` has to be one of these. */
export type ScreenKind =
  "intro" | "cram" | "rehearse" | "play" | "quiz" | "result" | "derailed";

/**
 * Deciding is choosing what to ride: the map, the cram band and the badges are
 * on screen. Doing is riding it: those collapse and the ride gets the page.
 * Results and derailed count as deciding, because the next move is a choice
 * and the map shows the progress that just moved.
 *
 * A `Record` makes every new screen kind pick a side, or the typecheck fails.
 */
const DOING: Record<ScreenKind, boolean> = {
  intro: false,
  cram: true,
  rehearse: true,
  play: true,
  quiz: true,
  result: false,
  derailed: false,
};

export const isDoing = (kind: ScreenKind) => DOING[kind];
