import { LINES } from "../data";
import { qid } from "./questions";
import { BOX_DAYS, emptyProgress } from "./save";
import type { Line, LineProgress, SaveData, Tier } from "./types";

export const DAY = 864e5;
export const TIERS: Record<
  Tier,
  { name: string; mult: number; blurb: string }
> = {
  1: {
    name: "Local",
    mult: 1,
    blurb: "The standard ride. All the helpers are on.",
  },
  2: {
    name: "Express",
    mult: 1.5,
    blurb: "Bigger inputs, more to keep track of. ×1.5 XP.",
  },
  3: {
    name: "Rush Hour",
    mult: 2,
    blurb: "Biggest inputs, fewer helpers, and a par time to beat. ×2 XP.",
  },
};

/**
 * Pegged to the content, not to a guess. Clearing one line at all three tiers
 * is about 830 XP, and there are 34 lines, so the map alone holds roughly
 * 28,000 before any reviews, drills or rehearsals. The old ladder topped out at
 * 5,500, which arrived after about seven lines.
 */
export const RANKS: [number, string][] = [
  [0, "Straphanger"],
  [300, "Conductor"],
  [800, "Dispatcher"],
  [1600, "Signal Engineer"],
  [2800, "Yardmaster"],
  [4500, "Line Supervisor"],
  [6800, "Chief of Operations"],
  [10000, "System Architect"],
  [14000, "Transit Authority"],
  [19000, "Transit Legend"],
];

/** XP floor of the rank you currently hold. A bad run cannot drop you below it. */
export function rankFloor(xp: number): number {
  let lo = 0;
  for (const [at] of RANKS) if (xp >= at) lo = at;
  return lo;
}

/** What a derailed ride costs. Drills are exempt: being wrong there is the point. */
export const DERAIL_COST = 50;

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(t = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const fmtTime = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function rankFor(xp: number) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const [lo, name] = RANKS[i];
  const next = RANKS[i + 1];
  return next
    ? {
        name,
        next: next[1],
        toNext: next[0] - xp,
        pct: Math.round(((xp - lo) / (next[0] - lo)) * 100),
      }
    : { name, next: null, toNext: 0, pct: 100 };
}

export const progressOf = (
  save: SaveData,
  idx: number,
): LineProgress | undefined => save.levels[LINES[idx].id];

/**
 * Lines unlock in order inside their own division, so starting NestJS does not
 * mean finishing every sorting line first.
 */
export const isUnlocked = (save: SaveData, idx: number): boolean => {
  const prev = LINES[idx - 1];
  if (!prev || prev.division !== LINES[idx].division) return true;
  return !!progressOf(save, idx - 1)?.cleared;
};

export const isDue = (p: LineProgress | undefined, now = Date.now()): boolean =>
  !!p && p.cleared && now >= p.due;

/** Highest tier the player may pick on a line. */
export const maxTier = (p: LineProgress | undefined): Tier =>
  Math.min((p?.tier ?? 0) + 1, 3) as Tier;

export function streakStatus(save: SaveData, now = Date.now()) {
  const { count, last } = save.streak;
  const today = dayKey(now);
  const alive = last === today || last === dayKey(now - DAY);
  if (!alive || !count) return "No streak yet. Ride today to start one.";
  return last === today
    ? `${count}-day streak. You rode today.`
    : `${count}-day streak. Ride today to keep it.`;
}

/**
 * Today's Daily Ride. Picked once per day from the unlocked lines and pinned,
 * so unlocking a new line mid-day doesn't move it. Mutates `save`.
 */
export function ensureDailyPick(save: SaveData, now = Date.now()): number {
  const k = dayKey(now);
  if (save.dailyPick?.day === k) {
    const pinned = LINES.findIndex((l) => l.id === save.dailyPick!.id);
    if (pinned > -1) return pinned;
  }
  const open = LINES.map((_, i) => i).filter((i) => isUnlocked(save, i));
  let h = 7;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const idx = open[h % open.length];
  save.dailyPick = { day: k, id: LINES[idx].id };
  return idx;
}

/** Where today's Daily Ride sits in LINES, or null when there is no pick. */
export function dailyIndex(save: SaveData): number | null {
  const i = LINES.findIndex((l) => l.id === save.dailyPick?.id);
  return i > -1 ? i : null;
}

export const dailyDone = (save: SaveData, now = Date.now()): boolean =>
  save.daily === dayKey(now);

/* ---------- readiness ---------- */

/**
 * Share of a line's questions you have answered and are not currently shaky on.
 * `null` when the line has no pool to measure (the algorithm games), so the
 * caller can weigh the other signals instead of inventing a number.
 */
function recallOf(line: Line, save: SaveData): number | null {
  const pool = line.questions ?? [];
  if (!pool.length) return null;
  let solid = 0;
  for (const q of pool) {
    const stat = save.questions[qid(line.id, q)];
    if (stat && stat.missed === 0) solid++;
  }
  // Measured against the whole pool, so full marks need full coverage.
  return solid / pool.length;
}

/**
 * How ready one line is right now, 0 to 1. Unlike XP this is a state, not a
 * total: it reflects what you would recall today, so it slides on its own as a
 * review goes overdue and climbs again when you ride.
 */
export function lineReadiness(
  line: Line,
  save: SaveData,
  now = Date.now(),
): number {
  const p = save.levels[line.id];
  if (!p?.cleared) return 0;
  const tier = (p.tier - 1) / 2;
  const depth = p.box / (BOX_DAYS.length - 1);
  const recall = recallOf(line, save);
  // What you have proven. Both forms top out at 1.
  const proven =
    recall === null
      ? 0.5 + 0.25 * tier + 0.25 * depth
      : 0.45 + 0.2 * tier + 0.2 * depth + 0.15 * recall;
  // Going stale costs you half of it, never all of it. You do not forget a line
  // you once cleared, you just would not want to be asked about it cold.
  const late = Math.max(0, now - p.due) / (BOX_DAYS[p.box] * DAY);
  return proven * (1 - 0.5 * Math.min(1, late));
}

/** Readiness across a set of lines, as a percentage. Lines you have not opened count as zero. */
export const readinessOf = (
  lines: Line[],
  save: SaveData,
  now = Date.now(),
): number =>
  lines.length
    ? Math.round(
        (lines.reduce((a, l) => a + lineReadiness(l, save, now), 0) /
          lines.length) *
          100,
      )
    : 0;

/** Readiness per division id, plus `all` across the whole map. */
export function readinessReport(
  save: SaveData,
  now = Date.now(),
): Record<string, number> {
  const out: Record<string, number> = { all: readinessOf(LINES, save, now) };
  for (const d of new Set(LINES.map((l) => l.division))) {
    out[d] = readinessOf(
      LINES.filter((l) => l.division === d),
      save,
      now,
    );
  }
  return out;
}

/* ---------- badges ---------- */

export interface Badge {
  id: string;
  name: string;
  how: string;
}

export const BADGES: Badge[] = [
  { id: "first", name: "First Fare", how: "Clear any line." },
  {
    id: "clean",
    name: "Clean Run",
    how: "Finish a trip without losing a heart.",
  },
  { id: "daily", name: "Daily Rider", how: "Clear the Daily Ride." },
  { id: "express", name: "Express Service", how: "Clear a line on Express." },
  { id: "rush", name: "Rush Hour Survivor", how: "Clear a line on Rush Hour." },
  { id: "par", name: "On Schedule", how: "Beat par time on Rush Hour." },
  {
    id: "flawless",
    name: "Flawless Rush",
    how: "Clear Rush Hour without losing a heart.",
  },
  { id: "graphs", name: "Network Map", how: "Clear BFS, DFS, and Dijkstra." },
  {
    id: "sorts",
    name: "Sorting Yard",
    how: "Clear bubble, merge, and quicksort.",
  },
  { id: "commuter", name: "Regular Commuter", how: "Do 3 on-time reviews." },
  { id: "pass3", name: "Three-Day Pass", how: "Ride 3 days in a row." },
  { id: "pass7", name: "Weekly Pass", how: "Ride 7 days in a row." },
  { id: "fullmap", name: "Full Map", how: "Clear every line." },
  {
    id: "master",
    name: "Line Master",
    how: "Clear Rush Hour on 5 different lines.",
  },
  { id: "cram", name: "Night Before", how: "Finish a cram drill." },
  {
    id: "outloud",
    name: "Out Loud",
    how: "Finish a rehearsal without reading from the screen.",
  },
];

interface BadgeContext {
  mistakes: number;
  tier: Tier;
  beatPar: boolean;
  daily: boolean;
}

/** Award any newly earned badges. Mutates `save`, returns the new ones. */
export function awardBadges(
  save: SaveData,
  ctx: BadgeContext,
  now = Date.now(),
): Badge[] {
  const has = (id: string) =>
    !!save.levels[id as keyof SaveData["levels"]]?.cleared;
  const atTier = (t: number) =>
    Object.values(save.levels).filter((p) => (p?.tier ?? 0) >= t).length;
  const rules: Record<string, () => boolean> = {
    first: () => true,
    clean: () => ctx.mistakes === 0,
    daily: () => ctx.daily,
    express: () => ctx.tier >= 2,
    rush: () => ctx.tier === 3,
    par: () => ctx.beatPar,
    flawless: () => ctx.tier === 3 && ctx.mistakes === 0,
    graphs: () => ["bfs", "dfs", "dij"].every(has),
    sorts: () => ["bub", "merge", "quick"].every(has),
    commuter: () => save.stats.reviews >= 3,
    pass3: () => save.streak.count >= 3,
    pass7: () => save.streak.count >= 7,
    fullmap: () => LINES.every((l) => has(l.id)),
    master: () => atTier(3) >= 5,
    // granted by finishCram and finishRehearsal, not by clearing a line
    cram: () => false,
    outloud: () => false,
  };
  const got: Badge[] = [];
  for (const b of BADGES) {
    if (!save.badges[b.id] && rules[b.id]()) {
      save.badges[b.id] = dayKey(now);
      got.push(b);
    }
  }
  return got;
}

/** A cram drill: XP and the daily streak, but no line progress or reviews. */
export function finishCram(
  prev: SaveData,
  o: { right: number; asked: number; time: number },
  now = Date.now(),
): TripResult {
  const save: SaveData = structuredClone(prev);
  const today = dayKey(now);
  const ledger: [string, number][] = [["Right answers", o.right * 10]];
  if (o.asked > 0 && o.right === o.asked) ledger.push(["Clean sweep", 50]);
  if (save.streak.last !== today) {
    save.streak.count =
      save.streak.last === dayKey(now - DAY) ? save.streak.count + 1 : 1;
    save.streak.last = today;
    ledger.push([
      `Day ${save.streak.count} of your streak`,
      10 * Math.min(save.streak.count, 7),
    ]);
  }
  const total = ledger.reduce((a, [, v]) => a + v, 0);
  save.xp += total;
  save.stats.trips++;
  save.badges.cram ??= today;
  const badges = BADGES.filter((b) => b.id === "cram" && !prev.badges.cram);
  return {
    save,
    ledger,
    total,
    badges,
    beatPar: false,
    newBest: false,
    unlockedTier: null,
    reviewInDays: 0,
  };
}

/**
 * An out-loud rehearsal. You grade yourself, so the XP is modest and the real
 * output is the list of prompts to ask first next time.
 */
export function finishRehearsal(
  prev: SaveData,
  o: { lineId: string; nailed: string[]; shaky: string[] },
  now = Date.now(),
): TripResult {
  const save: SaveData = structuredClone(prev);
  const today = dayKey(now);
  const total = o.nailed.length + o.shaky.length;
  const ledger: [string, number][] = [["Prompts answered", total * 10]];
  if (total > 0 && o.shaky.length === 0)
    ledger.push(["Said every one cleanly", 40]);
  if (save.streak.last !== today) {
    save.streak.count =
      save.streak.last === dayKey(now - DAY) ? save.streak.count + 1 : 1;
    save.streak.last = today;
    ledger.push([
      `Day ${save.streak.count} of your streak`,
      10 * Math.min(save.streak.count, 7),
    ]);
  }
  const xp = ledger.reduce((a, [, v]) => a + v, 0);
  save.xp += xp;
  save.rehearsal[o.lineId] = { last: now, shaky: o.shaky };
  const badges = BADGES.filter(
    (b) => b.id === "outloud" && !prev.badges.outloud,
  );
  save.badges.outloud ??= today;
  return {
    save,
    ledger,
    total: xp,
    badges,
    beatPar: false,
    newBest: false,
    unlockedTier: null,
    reviewInDays: 0,
  };
}

/**
 * Running out of hearts on a line. You already lose the stops you rode, the
 * clear and the review credit; this is the extra sting on top. It never drops
 * you below the rank you hold, because a rank is something you did and
 * readiness is the number that tells the truth about today.
 */
export function finishDerail(
  prev: SaveData,
  o: { drill: boolean },
): { save: SaveData; cost: number } {
  if (o.drill) return { save: prev, cost: 0 };
  const cost = Math.min(DERAIL_COST, Math.max(0, prev.xp - rankFloor(prev.xp)));
  return { save: cost ? { ...prev, xp: prev.xp - cost } : prev, cost };
}

/* ---------- finishing a trip ---------- */

export interface TripOutcome {
  lineIdx: number;
  tier: Tier;
  /** XP earned stop by stop during the ride. */
  rideXp: number;
  mistakes: number;
  /** Seconds. */
  time: number;
  quizOk: boolean;
}

export interface TripResult {
  save: SaveData;
  ledger: [string, number][];
  total: number;
  badges: Badge[];
  beatPar: boolean;
  newBest: boolean;
  /** Tier that just opened on this line, if any. */
  unlockedTier: Tier | null;
  reviewInDays: number;
}

/**
 * Pure scoring + progression for a finished trip. Takes the current save,
 * returns a new one plus everything the results screen shows.
 */
export function finishTrip(
  prev: SaveData,
  o: TripOutcome,
  now = Date.now(),
): TripResult {
  const save: SaveData = structuredClone(prev);
  const line = LINES[o.lineIdx];
  const p = (save.levels[line.id] ??= emptyProgress());
  const today = dayKey(now);
  const wasDue = isDue(p, now);
  const first = !p.cleared;
  const prevTier = p.tier;
  const isDaily =
    ensureDailyPick(save, now) === o.lineIdx && !dailyDone(save, now);
  const beatPar = o.tier === 3 && o.time <= line.par;

  // Worth more when you are working on something you have not locked in, so
  // replaying a mastered line is never the best XP on the board.
  const weak = lineReadiness(line, prev, now) < 0.5;
  const ledger: [string, number][] = [
    ["Stops ridden", o.rideXp],
    ["Line cleared", 50],
  ];
  if (weak) ledger.push(["Needed the work", 40]);
  if (o.mistakes === 0) ledger.push(["Perfect trip", 50]);
  if (o.quizOk) ledger.push(["Code check", 30]);
  if (wasDue) ledger.push(["On-time review", 40]);
  if (beatPar) ledger.push(["Beat par time", 75]);
  const sub = ledger.reduce((a, [, v]) => a + v, 0);
  const { mult, name } = TIERS[o.tier];
  if (mult > 1) ledger.push([`${name} ×${mult}`, Math.round(sub * (mult - 1))]);

  if (save.streak.last !== today) {
    save.streak.count =
      save.streak.last === dayKey(now - DAY) ? save.streak.count + 1 : 1;
    save.streak.last = today;
    ledger.push([
      `Day ${save.streak.count} of your streak`,
      10 * Math.min(save.streak.count, 7),
    ]);
  }
  if (isDaily) {
    save.daily = today;
    ledger.push(["Daily Ride", 100]);
  }
  const total = ledger.reduce((a, [, v]) => a + v, 0);

  // Spaced repetition: an on-time review with 0-1 mistakes moves up a box, a rough one moves down.
  if (first) p.box = 0;
  else if (wasDue)
    p.box =
      o.mistakes <= 1
        ? Math.min(p.box + 1, BOX_DAYS.length - 1)
        : Math.max(p.box - 1, 0);
  p.cleared = true;
  p.trips++;
  p.due = now + BOX_DAYS[p.box] * DAY;
  p.tier = Math.max(prevTier, o.tier) as Tier;

  const secs = Math.round(o.time);
  const b = p.best[o.tier];
  const newBest =
    !!b && (o.mistakes < b.m || (o.mistakes === b.m && secs < b.t));
  if (!b || newBest) p.best[o.tier] = { m: o.mistakes, t: secs };

  save.stats.trips++;
  if (wasDue) save.stats.reviews++;
  save.xp += total;

  const badges = awardBadges(
    save,
    { mistakes: o.mistakes, tier: o.tier, beatPar, daily: isDaily },
    now,
  );
  const unlockedTier =
    o.tier > prevTier && o.tier < 3 ? ((o.tier + 1) as Tier) : null;

  return {
    save,
    ledger,
    total,
    badges,
    beatPar,
    newBest,
    unlockedTier,
    reviewInDays: BOX_DAYS[p.box],
  };
}
