export type LineId = 'sq' | 'bfs' | 'dfs' | 'bin' | 'bub' | 'rec' | 'hash' | 'merge' | 'quick' | 'two' | 'dij';
export type Tier = 1 | 2 | 3;

export interface QuizQuestion {
  /** Code with a single `___` blank. */
  code: string;
  opts: string[];
  a: string;
  why: string;
}

export interface Line {
  id: LineId;
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
  bigO: string;
  /** Rush Hour par time in seconds. */
  par: number;
  quiz: QuizQuestion[];
}

export interface Guide {
  plain: string;
  words: [string, string][];
  code: { label: string; snippet: string; note?: string };
  when: string[];
  famous: string[];
  lore: string;
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
