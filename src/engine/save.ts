import type { LineId, LineProgress, SaveData, Tier } from "./types";

export const STORAGE_KEY = "express-local-v1";

/** Leitner boxes: days until the next review after each successful one. */
export const BOX_DAYS = [1, 3, 7, 14, 30];

export const emptySave = (): SaveData => ({
  xp: 0,
  levels: {},
  badges: {},
  stats: { reviews: 0, trips: 0 },
  streak: { count: 0, last: "" },
  daily: "",
  questions: {},
  rehearsal: {},
});

export const emptyProgress = (): LineProgress => ({
  cleared: false,
  box: 0,
  due: 0,
  trips: 0,
  tier: 0,
  best: {},
});

/**
 * Turn whatever was loaded or pasted into a save the app can trust. Nothing
 * is taken on faith: a field of the wrong type gets its default, an entry
 * that can't be read is dropped, and keys a save doesn't have are left out.
 * Also handles saves from the original single-file version, which predate
 * tiers, badges, and streaks.
 */
export function migrate(raw: unknown): SaveData {
  const base = emptySave();
  if (!isRecord(raw) || !("levels" in raw)) return base;
  const stats = isRecord(raw.stats) ? raw.stats : {};
  const streak = isRecord(raw.streak) ? raw.streak : {};
  const pick = raw.dailyPick;
  return {
    xp: num(raw.xp),
    levels: readEach(raw.levels, readProgress),
    badges: readEach(raw.badges, (v) => (typeof v === "string" ? v : null)),
    stats: { reviews: num(stats.reviews), trips: num(stats.trips) },
    streak: { count: num(streak.count), last: str(streak.last) },
    daily: str(raw.daily),
    questions: readEach(raw.questions, (v) =>
      isRecord(v) && isNum(v.seen) && isNum(v.missed) && isNum(v.last)
        ? { seen: v.seen, missed: v.missed, last: v.last }
        : null,
    ),
    rehearsal: readEach(raw.rehearsal, (v) =>
      isRecord(v)
        ? {
            last: num(v.last),
            shaky: Array.isArray(v.shaky)
              ? v.shaky.filter((s) => typeof s === "string")
              : [],
          }
        : null,
    ),
    // An index-based pick from an older save cannot be trusted once lines move,
    // so drop it and let today's ride be picked again.
    dailyPick:
      isRecord(pick) &&
      typeof pick.day === "string" &&
      typeof pick.id === "string"
        ? { day: pick.day, id: pick.id as LineId }
        : undefined,
  };
}

function readProgress(raw: unknown): LineProgress | null {
  if (!isRecord(raw)) return null;
  const cleared = raw.cleared === true;
  const tier = TIERS.find((t) => t === raw.tier) ?? 0;
  const best: LineProgress["best"] = {};
  if (isRecord(raw.best))
    for (const t of TIERS) {
      const b = raw.best[t];
      if (isRecord(b) && isNum(b.m) && isNum(b.t)) best[t] = { m: b.m, t: b.t };
    }
  return {
    cleared,
    box:
      Number.isInteger(raw.box) && num(raw.box) < BOX_DAYS.length
        ? num(raw.box)
        : 0,
    due: num(raw.due),
    trips: num(raw.trips),
    // Saves from before tiers only say a line was cleared.
    tier: cleared && !tier ? 1 : tier,
    best,
  };
}

const TIERS: Tier[] = [1, 2, 3];

/** An object with keys, not null or an array. */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** A real number, zero or more. Rules out NaN, Infinity and negatives. */
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

const num = (v: unknown): number => (isNum(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Keep the entries `read` can make sense of. It returns null for the rest. */
function readEach<T>(
  raw: unknown,
  read: (v: unknown) => T | null,
): Record<string, T> {
  const out: [string, T][] = [];
  if (isRecord(raw))
    for (const [k, v] of Object.entries(raw)) {
      const ok = read(v);
      if (ok !== null) out.push([k, ok]);
    }
  // fromEntries, not out[k] = ok, so a "__proto__" key stays a plain key.
  return Object.fromEntries(out);
}

export function loadSave(
  storage: Pick<Storage, "getItem"> | undefined = safeStorage(),
): SaveData {
  try {
    const txt = storage?.getItem(STORAGE_KEY);
    return migrate(txt ? JSON.parse(txt) : null);
  } catch {
    return emptySave();
  }
}

export function persistSave(
  save: SaveData,
  storage: Pick<Storage, "setItem"> | undefined = safeStorage(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* private mode or storage full: progress just won't stick */
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** A copy-pasteable save code. Base64 so it survives chat apps and notes. */
export function exportSave(save: SaveData): string {
  const json = JSON.stringify(save);
  return "EL1." + btoa(unescape(encodeURIComponent(json)));
}

/** Parse a save code (or raw JSON). Throws with a readable message if it's not valid. */
export function importSave(code: string): SaveData {
  const trimmed = code.trim();
  let json: string;
  if (trimmed.startsWith("EL1.")) {
    try {
      json = decodeURIComponent(escape(atob(trimmed.slice(4))));
    } catch {
      throw new Error(
        "That save code is damaged. Copy the whole thing, including the EL1. at the start.",
      );
    }
  } else json = trimmed;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error(
      "That doesn't look like a save code. It should start with EL1.",
    );
  }
  if (!isRecord(data) || !isRecord(data.levels))
    throw new Error(
      "That code is missing line progress, so there is nothing to import.",
    );
  return migrate(data);
}
