import type { LineId, LineProgress, SaveData } from './types';

export const STORAGE_KEY = 'express-local-v1';

export const emptySave = (): SaveData => ({
  xp: 0,
  levels: {},
  badges: {},
  stats: { reviews: 0, trips: 0 },
  streak: { count: 0, last: '' },
  daily: '',
  questions: {},
});

export const emptyProgress = (): LineProgress => ({ cleared: false, box: 0, due: 0, trips: 0, tier: 0, best: {} });

/**
 * Fill in anything missing. Handles saves from the original single-file
 * version, which predate tiers, badges, and streaks.
 */
export function migrate(raw: unknown): SaveData {
  const base = emptySave();
  if (!raw || typeof raw !== 'object' || !('levels' in raw)) return base;
  const r = raw as Partial<SaveData>;
  const levels: SaveData['levels'] = {};
  for (const [id, p] of Object.entries(r.levels ?? {})) {
    if (!p) continue;
    const prog = { ...emptyProgress(), ...p };
    if (prog.cleared && !prog.tier) prog.tier = 1;
    prog.best = prog.best ?? {};
    levels[id as LineId] = prog;
  }
  return {
    ...base,
    ...r,
    xp: Number(r.xp) || 0,
    levels,
    badges: r.badges ?? {},
    stats: { ...base.stats, ...r.stats },
    streak: { ...base.streak, ...r.streak },
    daily: r.daily ?? '',
    questions: r.questions ?? {},
  };
}

export function loadSave(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): SaveData {
  try {
    const txt = storage?.getItem(STORAGE_KEY);
    return migrate(txt ? JSON.parse(txt) : null);
  } catch {
    return emptySave();
  }
}

export function persistSave(save: SaveData, storage: Pick<Storage, 'setItem'> | undefined = safeStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* private mode or storage full: progress just won't stick */
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** A copy-pasteable save code. Base64 so it survives chat apps and notes. */
export function exportSave(save: SaveData): string {
  const json = JSON.stringify(save);
  return 'EL1.' + btoa(unescape(encodeURIComponent(json)));
}

/** Parse a save code (or raw JSON). Throws with a readable message if it's not valid. */
export function importSave(code: string): SaveData {
  const trimmed = code.trim();
  let json: string;
  if (trimmed.startsWith('EL1.')) {
    try {
      json = decodeURIComponent(escape(atob(trimmed.slice(4))));
    } catch {
      throw new Error("That save code is damaged. Copy the whole thing, including the EL1. at the start.");
    }
  } else json = trimmed;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("That doesn't look like a save code. It should start with EL1.");
  }
  if (!data || typeof data !== 'object' || !('levels' in data)) throw new Error('That code is missing line progress, so there is nothing to import.');
  return migrate(data);
}
