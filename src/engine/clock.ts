/**
 * Why the clock is paused. Each reason is held and released on its own, so
 * coming back to the tab does not restart a clock that is paused for reading.
 */
export type HoldReason = "reading" | "hidden";

/**
 * A ride's stopwatch. It runs only while nothing holds it, so time spent
 * reading an explanation or on another tab does not count.
 */
export interface Clock {
  /** When the clock started, pushed later by every pause. */
  t0: number;
  /** When the current pause began, or 0 while the clock runs. */
  heldAt: number;
  holds: Set<HoldReason>;
}

export const startClock = (now = Date.now()): Clock => ({
  t0: now,
  heldAt: 0,
  holds: new Set(),
});

export function holdClock(c: Clock, why: HoldReason, now = Date.now()): void {
  if (c.holds.size === 0) c.heldAt = now;
  c.holds.add(why);
}

/** The clock runs again only once the last reason is released. */
export function releaseClock(
  c: Clock,
  why: HoldReason,
  now = Date.now(),
): void {
  if (!c.holds.delete(why) || c.holds.size > 0) return;
  c.t0 += now - c.heldAt;
  c.heldAt = 0;
}

/** Seconds counted so far. While held, this stays where the pause began. */
export const clockSeconds = (c: Clock, now = Date.now()): number =>
  ((c.heldAt || now) - c.t0) / 1000;
