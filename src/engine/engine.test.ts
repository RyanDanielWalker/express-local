import { describe, expect, it } from 'vitest';
import { DAY, dayKey, ensureDailyPick, finishCram, finishTrip, isUnlocked, maxTier, rankFor } from './progression';
import { cramPool, cramQuestions, CRAM_SIZE, qid, recordAnswers, shakyQuestions } from './questions';
import { LINES } from '../data';
import { nextStep, pickFlows, pickQuestions, QUESTIONS_PER_RUN } from './questions';
import type { Flow, Question, Tier } from './types';
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

  it('opens lines in order inside a division, and tiers one at a time', () => {
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

  it('pays the Daily Ride bonus once per day, on whichever line is picked', () => {
    const save = emptySave();
    const lineIdx = ensureDailyPick(save, NOW);
    const r1 = finishTrip(save, { ...outcome, lineIdx }, NOW);
    expect(r1.ledger.some(([k]) => k === 'Daily Ride')).toBe(true);
    const r2 = finishTrip(r1.save, { ...outcome, lineIdx }, NOW);
    expect(r2.ledger.some(([k]) => k === 'Daily Ride')).toBe(false);
  });
});

describe('question pools', () => {
  const pool: Question[] = [1, 1, 2, 2, 3, 3, 1, 2, 3, 1, 2, 3].map((t, i) => ({
    t: t as Tier, q: `q${i}`, opts: ['a', 'b'], a: 'a', why: 'because',
  }));

  it('only asks questions unlocked at the current tier', () => {
    expect(pickQuestions(pool, 1).every(q => q.t === 1)).toBe(true);
    expect(pickQuestions(pool, 2).every(q => q.t <= 2)).toBe(true);
    expect(pickQuestions(pool, 3, 99).some(q => q.t === 3)).toBe(true);
  });

  it('asks more questions at higher tiers and never repeats one in a run', () => {
    for (const tier of [1, 2, 3] as Tier[]) {
      const run = pickQuestions(pool, tier);
      expect(run.length).toBe(Math.min(QUESTIONS_PER_RUN[tier], pool.filter(q => q.t <= tier).length));
      expect(new Set(run.map(q => q.q)).size).toBe(run.length);
    }
  });

  it('does not mutate or drain the pool', () => {
    const before = pool.map(q => q.q);
    pickQuestions(pool, 3);
    pickQuestions(pool, 3);
    expect(pool.map(q => q.q)).toEqual(before);
  });

  it('walks a flow one step at a time and reports the end', () => {
    const flow: Flow = { t: 1, title: 'a request', steps: ['one', 'two', 'three'], note: 'that is why' };
    expect(nextStep(flow, [])).toBe('one');
    expect(nextStep(flow, ['one', 'two'])).toBe('three');
    expect(nextStep(flow, ['one', 'two', 'three'])).toBeNull();
    expect(pickFlows([flow], 1)).toHaveLength(1);
  });
});

describe('cram drills', () => {
  const open = () => true;

  it('pulls questions from every opened line, including algorithm code checks', () => {
    const pool = cramPool(LINES, open);
    expect(pool.length).toBeGreaterThan(100);
    expect(cramQuestions(pool)).toHaveLength(CRAM_SIZE);
    expect(cramQuestions(pool).every(q => q.opts.includes(q.a))).toBe(true);
  });

  it('can be filtered to one division', () => {
    const nest = cramPool(LINES, open, ['nest']);
    const all = cramPool(LINES, open);
    expect(nest.length).toBeGreaterThan(40);
    expect(nest.length).toBeLessThan(all.length);
  });

  it('skips lines that are still locked', () => {
    const firstOnly = cramPool(LINES, (_, i) => i === 0);
    expect(firstOnly.length).toBeGreaterThan(0);
    expect(firstOnly.length).toBeLessThan(cramPool(LINES, open).length);
  });

  it('awards XP and the streak but leaves line progress alone', () => {
    const before = finishTrip(emptySave(), outcome, NOW).save;
    const r = finishCram(before, { right: 10, asked: 12, time: 120 }, NOW);
    expect(r.total).toBe(100);
    expect(r.save.levels).toEqual(before.levels);
    expect(r.save.badges.cram).toBeTruthy();
    expect(r.unlockedTier).toBeNull();
  });
});

describe('weak spots', () => {
  const q = (text: string) => ({ t: 1 as const, q: text, opts: ['a', 'b'], a: 'a', why: 'because' });
  const line = LINES.find(l => l.questions?.length)!;
  const first = line.questions![0];
  const second = line.questions![1];

  it('gives a question a stable id that survives a reshuffle', () => {
    expect(qid(line.id, first)).toBe(qid(line.id, { ...first, opts: [...first.opts].reverse() }));
    expect(qid(line.id, first)).not.toBe(qid(line.id, second));
    expect(qid('a', q('same text'))).not.toBe(qid('b', q('same text')));
  });

  it('counts misses and forgives two right answers in a row', () => {
    let save = emptySave();
    save = recordAnswers(save, [{ lineId: line.id, question: first, correct: false }], NOW);
    expect(shakyQuestions(save, LINES).map(s => s.question)).toEqual([first]);
    save = recordAnswers(save, [{ lineId: line.id, question: first, correct: true }], NOW);
    expect(shakyQuestions(save, LINES)).toHaveLength(0);
    expect(save.questions[qid(line.id, first)].seen).toBe(2);
  });

  it('sorts the shaky list worst first and can filter to one line', () => {
    let save = emptySave();
    save = recordAnswers(save, [
      { lineId: line.id, question: first, correct: false },
      { lineId: line.id, question: first, correct: false },
      { lineId: line.id, question: second, correct: false },
    ], NOW);
    expect(shakyQuestions(save, LINES).map(s => s.missed)).toEqual([2, 1]);
    expect(shakyQuestions(save, LINES, 'nope')).toHaveLength(0);
  });

  it('does not mutate the save it was given', () => {
    const save = emptySave();
    recordAnswers(save, [{ lineId: line.id, question: first, correct: false }], NOW);
    expect(save.questions).toEqual({});
  });

  it('fills up to half a cram drill with questions you have missed', () => {
    const pool = cramPool(LINES, () => true);
    const shaky = pool.slice(50, 58);
    const drill = cramQuestions(pool, CRAM_SIZE, shaky);
    expect(drill).toHaveLength(CRAM_SIZE);
    expect(new Set(drill).size).toBe(CRAM_SIZE);
    expect(drill.filter(q => shaky.includes(q)).length).toBe(Math.floor(CRAM_SIZE / 2));
  });
});
