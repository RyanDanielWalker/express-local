import { LINES } from '../data';
import { emptyProgress } from './save';
import type { LineProgress, SaveData, Tier } from './types';

export const DAY = 864e5;
/** Leitner boxes: days until the next review after each successful one. */
export const BOX_DAYS = [1, 3, 7, 14, 30];

export const TIERS: Record<Tier, { name: string; mult: number; blurb: string }> = {
  1: { name: 'Local', mult: 1, blurb: 'The standard ride. All the helpers are on.' },
  2: { name: 'Express', mult: 1.5, blurb: 'Bigger inputs, more to keep track of. ×1.5 XP.' },
  3: { name: 'Rush Hour', mult: 2, blurb: 'Biggest inputs, fewer helpers, and a par time to beat. ×2 XP.' },
};

export const RANKS: [number, string][] = [
  [0, 'Straphanger'],
  [250, 'Conductor'],
  [700, 'Dispatcher'],
  [1500, 'Signal Engineer'],
  [3000, 'Chief of Operations'],
  [5500, 'Transit Legend'],
];

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(t = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const fmtTime = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function rankFor(xp: number) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const [lo, name] = RANKS[i];
  const next = RANKS[i + 1];
  return next
    ? { name, next: next[1], toNext: next[0] - xp, pct: Math.round(((xp - lo) / (next[0] - lo)) * 100) }
    : { name, next: null, toNext: 0, pct: 100 };
}

export const progressOf = (save: SaveData, idx: number): LineProgress | undefined => save.levels[LINES[idx].id];

/**
 * Lines unlock in order inside their own division, so starting NestJS does not
 * mean finishing every sorting line first.
 */
export const isUnlocked = (save: SaveData, idx: number): boolean => {
  const prev = LINES[idx - 1];
  if (!prev || prev.division !== LINES[idx].division) return true;
  return !!progressOf(save, idx - 1)?.cleared;
};

export const isDue = (p: LineProgress | undefined, now = Date.now()): boolean => !!p && p.cleared && now >= p.due;

/** Highest tier the player may pick on a line. */
export const maxTier = (p: LineProgress | undefined): Tier => Math.min((p?.tier ?? 0) + 1, 3) as Tier;

export function streakStatus(save: SaveData, now = Date.now()) {
  const { count, last } = save.streak;
  const today = dayKey(now);
  const alive = last === today || last === dayKey(now - DAY);
  if (!alive || !count) return 'No streak yet. Ride today to start one.';
  return last === today ? `${count}-day streak. You rode today.` : `${count}-day streak. Ride today to keep it.`;
}

/**
 * Today's Daily Ride. Picked once per day from the unlocked lines and pinned,
 * so unlocking a new line mid-day doesn't move it. Mutates `save`.
 */
export function ensureDailyPick(save: SaveData, now = Date.now()): number {
  const k = dayKey(now);
  if (save.dailyPick?.day === k) return save.dailyPick.idx;
  const open = LINES.map((_, i) => i).filter(i => isUnlocked(save, i));
  let h = 7;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  save.dailyPick = { day: k, idx: open[h % open.length] };
  return save.dailyPick.idx;
}

export const dailyDone = (save: SaveData, now = Date.now()): boolean => save.daily === dayKey(now);

/* ---------- badges ---------- */

export interface Badge {
  id: string;
  name: string;
  how: string;
}

export const BADGES: Badge[] = [
  { id: 'first', name: 'First Fare', how: 'Clear any line.' },
  { id: 'clean', name: 'Clean Run', how: 'Finish a trip without losing a heart.' },
  { id: 'daily', name: 'Daily Rider', how: 'Clear the Daily Ride.' },
  { id: 'express', name: 'Express Service', how: 'Clear a line on Express.' },
  { id: 'rush', name: 'Rush Hour Survivor', how: 'Clear a line on Rush Hour.' },
  { id: 'par', name: 'On Schedule', how: 'Beat par time on Rush Hour.' },
  { id: 'flawless', name: 'Flawless Rush', how: 'Clear Rush Hour without losing a heart.' },
  { id: 'graphs', name: 'Network Map', how: 'Clear BFS, DFS, and Dijkstra.' },
  { id: 'sorts', name: 'Sorting Yard', how: 'Clear bubble, merge, and quicksort.' },
  { id: 'commuter', name: 'Regular Commuter', how: 'Do 3 on-time reviews.' },
  { id: 'pass3', name: 'Three-Day Pass', how: 'Ride 3 days in a row.' },
  { id: 'pass7', name: 'Weekly Pass', how: 'Ride 7 days in a row.' },
  { id: 'fullmap', name: 'Full Map', how: 'Clear every line.' },
  { id: 'master', name: 'Line Master', how: 'Clear Rush Hour on 5 different lines.' },
  { id: 'cram', name: 'Night Before', how: 'Finish a cram drill.' },
];

interface BadgeContext {
  mistakes: number;
  tier: Tier;
  beatPar: boolean;
  daily: boolean;
}

/** Award any newly earned badges. Mutates `save`, returns the new ones. */
export function awardBadges(save: SaveData, ctx: BadgeContext, now = Date.now()): Badge[] {
  const has = (id: string) => !!save.levels[id as keyof SaveData['levels']]?.cleared;
  const atTier = (t: number) => Object.values(save.levels).filter(p => (p?.tier ?? 0) >= t).length;
  const rules: Record<string, () => boolean> = {
    first: () => true,
    clean: () => ctx.mistakes === 0,
    daily: () => ctx.daily,
    express: () => ctx.tier >= 2,
    rush: () => ctx.tier === 3,
    par: () => ctx.beatPar,
    flawless: () => ctx.tier === 3 && ctx.mistakes === 0,
    graphs: () => ['bfs', 'dfs', 'dij'].every(has),
    sorts: () => ['bub', 'merge', 'quick'].every(has),
    commuter: () => save.stats.reviews >= 3,
    pass3: () => save.streak.count >= 3,
    pass7: () => save.streak.count >= 7,
    fullmap: () => LINES.every(l => has(l.id)),
    master: () => atTier(3) >= 5,
    // granted by finishCram, not by clearing a line
    cram: () => false,
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
export function finishCram(prev: SaveData, o: { right: number; asked: number; time: number }, now = Date.now()): TripResult {
  const save: SaveData = structuredClone(prev);
  const today = dayKey(now);
  const ledger: [string, number][] = [['Right answers', o.right * 10]];
  if (o.asked > 0 && o.right === o.asked) ledger.push(['Clean sweep', 50]);
  if (save.streak.last !== today) {
    save.streak.count = save.streak.last === dayKey(now - DAY) ? save.streak.count + 1 : 1;
    save.streak.last = today;
    ledger.push([`Day ${save.streak.count} of your streak`, 10 * Math.min(save.streak.count, 7)]);
  }
  const total = ledger.reduce((a, [, v]) => a + v, 0);
  save.xp += total;
  save.stats.trips++;
  save.badges.cram ??= today;
  const badges = BADGES.filter(b => b.id === 'cram' && !prev.badges.cram);
  return { save, ledger, total, badges, beatPar: false, newBest: false, unlockedTier: null, reviewInDays: 0 };
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
export function finishTrip(prev: SaveData, o: TripOutcome, now = Date.now()): TripResult {
  const save: SaveData = structuredClone(prev);
  const line = LINES[o.lineIdx];
  const p = (save.levels[line.id] ??= emptyProgress());
  const today = dayKey(now);
  const wasDue = isDue(p, now);
  const first = !p.cleared;
  const prevTier = p.tier;
  const isDaily = ensureDailyPick(save, now) === o.lineIdx && !dailyDone(save, now);
  const beatPar = o.tier === 3 && o.time <= line.par;

  const ledger: [string, number][] = [['Stops ridden', o.rideXp], ['Line cleared', 50]];
  if (o.mistakes === 0) ledger.push(['Perfect trip', 50]);
  if (o.quizOk) ledger.push(['Code check', 30]);
  if (wasDue) ledger.push(['On-time review', 40]);
  if (beatPar) ledger.push(['Beat par time', 75]);
  const sub = ledger.reduce((a, [, v]) => a + v, 0);
  const { mult, name } = TIERS[o.tier];
  if (mult > 1) ledger.push([`${name} ×${mult}`, Math.round(sub * (mult - 1))]);

  if (save.streak.last !== today) {
    save.streak.count = save.streak.last === dayKey(now - DAY) ? save.streak.count + 1 : 1;
    save.streak.last = today;
    ledger.push([`Day ${save.streak.count} of your streak`, 10 * Math.min(save.streak.count, 7)]);
  }
  if (isDaily) {
    save.daily = today;
    ledger.push(['Daily Ride', 100]);
  }
  const total = ledger.reduce((a, [, v]) => a + v, 0);

  // Spaced repetition: an on-time review with 0-1 mistakes moves up a box, a rough one moves down.
  if (first) p.box = 0;
  else if (wasDue) p.box = o.mistakes <= 1 ? Math.min(p.box + 1, BOX_DAYS.length - 1) : Math.max(p.box - 1, 0);
  p.cleared = true;
  p.trips++;
  p.due = now + BOX_DAYS[p.box] * DAY;
  p.tier = Math.max(prevTier, o.tier) as Tier;

  const secs = Math.round(o.time);
  const b = p.best[o.tier];
  const newBest = !!b && (o.mistakes < b.m || (o.mistakes === b.m && secs < b.t));
  if (!b || newBest) p.best[o.tier] = { m: o.mistakes, t: secs };

  save.stats.trips++;
  if (wasDue) save.stats.reviews++;
  save.xp += total;

  const badges = awardBadges(save, { mistakes: o.mistakes, tier: o.tier, beatPar, daily: isDaily }, now);
  const unlockedTier = o.tier > prevTier && o.tier < 3 ? ((o.tier + 1) as Tier) : null;

  return { save, ledger, total, badges, beatPar, newBest, unlockedTier, reviewInDays: BOX_DAYS[p.box] };
}
