import { LINES } from "../data";
import { dailyDone, dailyIndex, isDue, isUnlocked } from "./progression";
import { shakyQuestions } from "./questions";
import type { SaveData } from "./types";

/** One thing worth doing right now. Line positions are indexes into LINES. */
export type TodayItem =
  | { kind: "review"; lineIdx: number; more: number }
  | { kind: "shaky"; count: number }
  | { kind: "daily"; lineIdx: number }
  | { kind: "next"; lineIdx: number };

/**
 * The next line you have unlocked and not cleared. It looks in the division
 * you are on first, so finishing a React line suggests the next React line,
 * not the first algorithm line on the map. `null` when everything is cleared.
 */
export function nextLine(save: SaveData, current: number): number | null {
  const fresh = LINES.map((_, i) => i).filter(
    (i) => isUnlocked(save, i) && !save.levels[LINES[i].id]?.cleared,
  );
  const division = LINES[current]?.division;
  const here = fresh.find((i) => LINES[i].division === division);
  return here ?? fresh[0] ?? null;
}

/**
 * What to do right now, most urgent first. A review that is due comes first,
 * because a late review is what makes a line fade. Then the questions you keep
 * missing, then the Daily Ride, then a line you have not cleared yet. A line
 * shows up once at most: a Daily Ride that is also due is just a review.
 * Empty when there is nothing to do.
 */
export function todayPlan(
  save: SaveData,
  current: number,
  now = Date.now(),
): TodayItem[] {
  const items: TodayItem[] = [];

  const due = LINES.map((_, i) => i).filter((i) =>
    isDue(save.levels[LINES[i].id], now),
  );
  if (due.length)
    items.push({ kind: "review", lineIdx: due[0], more: due.length - 1 });

  const shaky = shakyQuestions(save, LINES).length;
  if (shaky) items.push({ kind: "shaky", count: shaky });

  const daily = dailyIndex(save);
  const showDaily =
    daily !== null &&
    isUnlocked(save, daily) &&
    !dailyDone(save, now) &&
    !due.includes(daily);
  if (showDaily) items.push({ kind: "daily", lineIdx: daily });

  const next = nextLine(save, current);
  if (next !== null && !(showDaily && next === daily))
    items.push({ kind: "next", lineIdx: next });

  return items;
}
