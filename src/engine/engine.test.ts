import { describe, expect, it } from 'vitest';
import { DAY, dayKey, finishTrip, isUnlocked, maxTier, rankFor } from './progression';
import { emptySave, exportSave, importSave, migrate } from './save';
import type { SaveData } from './types';

const NOW = new Date('2026-09-21T15:00:00').getTime();
const outcome = { lineIdx: 0, tier: 1 as const, rideXp: 80, mistakes: 0, time: 50, quizOk: true };

describe('save data', () => {
  it('migrates the original single-file save shape', () => {
    const old = { xp: 300, levels: { sq: { cleared: true, box: 1, due: 0, trips: 2 } } };
    const s = migrate(old);
    expect(s.levels.sq?.tier).toBe(1);
    expect(s.levels.sq?.best).toEqual({});
    expect(s.streak).toEqual({ count: 0, last: '' });
  });

  it('round-trips through an export code', () => {
    const s = migrate({ xp: 42, levels: { bfs: { cleared: true, tier: 2 } } });
    expect(importSave(exportSave(s))).toEqual(s);
  });

  it('explains what is wrong with a bad code', () => {
    expect(() => importSave('hello')).toThrow(/save code/);
  });
});

describe('ranks and unlocks', () => {
  it('reports progress toward the next rank', () => {
    expect(rankFor(0)).toMatchObject({ name: 'Straphanger', next: 'Conductor', toNext: 250 });
    expect(rankFor(99999).next).toBeNull();
  });

  it('opens lines in order and tiers one at a time', () => {
    const s = emptySave();
    expect(isUnlocked(s, 0)).toBe(true);
    expect(isUnlocked(s, 1)).toBe(false);
    expect(maxTier(undefined)).toBe(1);
    expect(maxTier({ cleared: true, box: 0, due: 0, trips: 1, tier: 3, best: {} })).toBe(3);
  });
});

describe('finishing a trip', () => {
  it('awards XP, starts a streak, unlocks the next tier and line', () => {
    const r = finishTrip(emptySave(), outcome, NOW);
    expect(r.save.levels.sq).toMatchObject({ cleared: true, tier: 1, trips: 1, box: 0 });
    expect(r.save.streak).toEqual({ count: 1, last: dayKey(NOW) });
    expect(r.unlockedTier).toBe(2);
    expect(isUnlocked(r.save, 1)).toBe(true);
    expect(r.badges.map(b => b.id)).toEqual(expect.arrayContaining(['first', 'clean']));
    expect(r.total).toBe(r.ledger.reduce((a, [, v]) => a + v, 0));
    expect(r.save.xp).toBe(r.total);
  });

  it('does not mutate the save it was given', () => {
    const s = emptySave();
    finishTrip(s, outcome, NOW);
    expect(s).toEqual(emptySave());
  });

  it('applies the tier multiplier and par bonus on Rush Hour', () => {
    const base = finishTrip(emptySave(), outcome, NOW).save;
    const r = finishTrip(base, { ...outcome, tier: 3, time: 10 }, NOW);
    expect(r.beatPar).toBe(true);
    expect(r.ledger.find(([k]) => k.startsWith('Rush Hour'))).toBeTruthy();
    expect(r.badges.map(b => b.id)).toEqual(expect.arrayContaining(['rush', 'par', 'flawless']));
  });

  it('continues a streak from yesterday and resets after a gap', () => {
    const s: SaveData = { ...emptySave(), streak: { count: 4, last: dayKey(NOW - DAY) } };
    expect(finishTrip(s, outcome, NOW).save.streak.count).toBe(5);
    const gap: SaveData = { ...emptySave(), streak: { count: 4, last: dayKey(NOW - 3 * DAY) } };
    expect(finishTrip(gap, outcome, NOW).save.streak.count).toBe(1);
  });

  it('moves a line up a review box on a clean on-time review', () => {
    const first = finishTrip(emptySave(), outcome, NOW).save;
    const later = NOW + 2 * DAY;
    const r = finishTrip(first, outcome, later);
    expect(r.save.levels.sq?.box).toBe(1);
    expect(r.ledger.some(([k]) => k === 'On-time review')).toBe(true);
    expect(r.reviewInDays).toBe(3);
  });

  it('tracks personal bests by fewest mistakes, then time', () => {
    const a = finishTrip(emptySave(), { ...outcome, mistakes: 2, time: 60 }, NOW).save;
    const b = finishTrip(a, { ...outcome, mistakes: 1, time: 90 }, NOW);
    expect(b.newBest).toBe(true);
    expect(b.save.levels.sq?.best[1]).toEqual({ m: 1, t: 90 });
  });

  it('pays the Daily Ride bonus once per day', () => {
    const r1 = finishTrip(emptySave(), outcome, NOW);
    expect(r1.ledger.some(([k]) => k === 'Daily Ride')).toBe(true);
    const r2 = finishTrip(r1.save, outcome, NOW);
    expect(r2.ledger.some(([k]) => k === 'Daily Ride')).toBe(false);
  });
});
