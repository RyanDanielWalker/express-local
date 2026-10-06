export type AlgoLineId = 'sq' | 'bfs' | 'dfs' | 'bin' | 'bub' | 'rec' | 'hash' | 'merge' | 'quick' | 'two' | 'dij';
/** Every line on the map. Each division adds its ids here. */
export type LineId = AlgoLineId;
export type Tier = 1 | 2 | 3;

/** Lines are grouped into divisions on the map, and each division unlocks on its own. */
export type Division = 'algos' | 'nest' | 'react';

/** How a line is played. */
export type LineKind =
  | 'game'   // a hand-built interactive game component (the algorithm lines)
  | 'quiz'   // multiple choice drilled from a question pool
  | 'flow';  // put the steps of a process in the right order

/** One multiple-choice question. `t` is the lowest tier it shows up on. */
export interface Question {
  t: Tier;
  q: string;
  code?: string;
  opts: string[];
  /** The correct option, matched by exact text. */
  a: string;
  why: string;
}

/** One ordering puzzle: put `steps` back in order. */
export interface Flow {
  t: Tier;
  title: string;
  steps: string[];
  note: string;
}

export interface QuizQuestion {
  /** Code with a single `___` blank. */
  code: string;
  opts: string[];
  a: string;
  why: string;
}

export interface Line {
  id: LineId;
  division: Division;
  kind: LineKind;
  bullet: string;
  /** CSS custom property holding the line color, e.g. `--red`. */
  color: string;
  /** Bullet uses dark text (for light line colors like yellow). */
  darkText?: boolean;
  short: string;
  name: string;
  topic: string;
  pitch: string;
  rules: string[];
  hook: string;
  /** Complexity stamp on the results screen. Algorithm lines only. */
  bigO?: string;
  /** Rush Hour par time in seconds. */
  par: number;
  /** End-of-run code check. Algorithm lines only. */
  quiz?: QuizQuestion[];
  /** Question pool for `kind: 'quiz'` lines. */
  questions?: Question[];
  /** Ordering puzzles for `kind: 'flow'` lines. */
  flows?: Flow[];
}

export interface Guide {
  plain: string;
  words: [string, string][];
  code: { label: string; snippet: string; note?: string };
  /** When to reach for it. Algorithm lines. */
  when?: string[];
  /** Famous problems and real-world uses. Algorithm lines. */
  famous?: string[];
  /** Backstory. Algorithm lines. */
  lore?: string;
  /** Interview talking points, written to be said out loud. */
  say?: string[];
  /** The thing people get wrong. */
  gotcha?: string;
}

export interface Best {
  /** Fewest mistakes. */
  m: number;
  /** Time in seconds (tiebreaker). */
  t: number;
}

export interface LineProgress {
  cleared: boolean;
  /** Leitner box index into BOX_DAYS. */
  box: number;
  /** Timestamp (ms) when the next review is due. */
  due: number;
  trips: number;
  /** Highest tier cleared, 0 if none. */
  tier: 0 | Tier;
  best: Partial<Record<Tier, Best>>;
}

export interface SaveData {
  xp: number;
  levels: Partial<Record<LineId, LineProgress>>;
  /** Badge id -> day earned (YYYY-MM-DD). */
  badges: Record<string, string>;
  stats: { reviews: number; trips: number };
  streak: { count: number; last: string };
  /** Day the Daily Ride was last cleared. */
  daily: string;
  dailyPick?: { day: string; idx: number };
}
