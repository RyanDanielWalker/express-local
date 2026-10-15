import { describe, expect, it } from 'vitest';
import { DAY, dayKey, DERAIL_COST, ensureDailyPick, finishCram, finishDerail, finishRehearsal, finishTrip, isUnlocked, lineReadiness, maxTier, rankFloor, rankFor, RANKS, readinessOf } from './progression';
import { cramPool, cramQuestions, CRAM_SIZE, qid, recordAnswers, shakyQuestions } from './questions';
import { GUIDE, LINES } from '../data';
import { flowSlip, heartsFor, nextStep, pickFlows, pickPuzzle, pickQuestions, QUESTIONS_PER_RUN, revealAfterMiss, solidIn } from './questions';
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
    expect(rankFor(0)).toMatchObject({ name: 'Straphanger', next: 'Conductor', toNext: RANKS[1][0] });
    expect(rankFor(999999).next).toBeNull();
  });

  it('keeps the rank ladder pegged to the content', () => {
    // One line at all three tiers is roughly 830 XP. The top rank should not
    // arrive before most of the map is behind you.
    const perLine = 830;
    const top = RANKS[RANKS.length - 1][0];
    expect(top / perLine).toBeGreaterThan(LINES.length * 0.6);
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i][0]).toBeGreaterThan(RANKS[i - 1][0]);
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

  it('asks what you have not answered cleanly before repeating what you have', () => {
    const t1 = pool.filter(q => q.t === 1); // 4 questions, a run of 6 at tier 2 draws from 8
    const solid = new Set(t1.map(q => q.q));
    for (let i = 0; i < 20; i++) {
      const run = pickQuestions(pool, 2, 4, q => solid.has(q.q));
      expect(run.every(q => !solid.has(q.q))).toBe(true);
    }
    // once everything is solid, it still fills the run
    expect(pickQuestions(pool, 1, 4, () => true)).toHaveLength(4);
  });

  it('counts a question as solid only when it was answered and is not shaky', () => {
    const [a, b, c] = pool;
    const history = { [qid('di', a)]: { seen: 2, missed: 0, last: 0 }, [qid('di', b)]: { seen: 3, missed: 1, last: 0 } };
    const isSolid = solidIn(history, 'di');
    expect([isSolid(a), isSolid(b), isSolid(c)]).toEqual([true, false, false]);
    expect(solidIn(undefined, 'di')(a)).toBe(false);
  });

  it('walks a flow one step at a time and reports the end', () => {
    const flow: Flow = { t: 1, title: 'a request', steps: ['one', 'two', 'three'], note: 'that is why' };
    expect(nextStep(flow, [])).toBe('one');
    expect(nextStep(flow, ['one', 'two'])).toBe('three');
    expect(nextStep(flow, ['one', 'two', 'three'])).toBeNull();
    expect(pickFlows([flow], 1)).toHaveLength(1);
  });

  it('explains a flow slip by position, and by what was tried instead', () => {
    const flow: Flow = { t: 1, title: 'a request', steps: ['Middleware', 'Guard', 'Pipe'], decoys: ['Filter'], note: '' };
    expect(flowSlip(flow, 'Middleware', [])).toBe('runs first.');
    expect(flowSlip(flow, 'Guard', ['Pipe'])).toBe('comes right after Middleware. You tried Pipe, which comes later.');
    expect(flowSlip(flow, 'Guard', ['Filter'])).toBe('comes right after Middleware. You tried Filter, which does not happen in this run.');
    expect(flowSlip(flow, 'Middleware', ['Pipe', 'Guard', 'Filter'])).toBe(
      'runs first. You tried Pipe and Guard, which come later, and Filter, which does not happen in this run.',
    );
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
    // at least half, and more only because the random half can draw shaky ones too
    expect(drill.filter(q => shaky.includes(q)).length).toBeGreaterThanOrEqual(Math.floor(CRAM_SIZE / 2));
  });
});

describe('out-loud rehearsals', () => {
  it('awards XP, remembers the shaky prompts, and leaves line progress alone', () => {
    const before = finishTrip(emptySave(), outcome, NOW).save;
    const r = finishRehearsal(before, { lineId: 'di', nailed: ['a', 'b'], shaky: ['c'] }, NOW);
    expect(r.total).toBe(30);
    expect(r.save.rehearsal.di).toEqual({ last: NOW, shaky: ['c'] });
    expect(r.save.levels).toEqual(before.levels);
    expect(r.save.badges.outloud).toBeTruthy();
  });

  it('pays a bonus when nothing was shaky', () => {
    const r = finishRehearsal(emptySave(), { lineId: 'di', nailed: ['a', 'b'], shaky: [] }, NOW);
    expect(r.ledger.some(([k]) => k === 'Said every one cleanly')).toBe(true);
  });

  it('clears the shaky list when the second pass goes clean', () => {
    const first = finishRehearsal(emptySave(), { lineId: 'di', nailed: [], shaky: ['c'] }, NOW).save;
    const second = finishRehearsal(first, { lineId: 'di', nailed: ['c'], shaky: [] }, NOW + DAY).save;
    expect(second.rehearsal.di.shaky).toEqual([]);
  });
});

describe('rehearsal content', () => {
  it('gives every NestJS and React line prompts with real answers', () => {
    for (const line of LINES.filter(l => l.division !== 'algos')) {
      const prompts = GUIDE[line.id].rehearse ?? [];
      expect(prompts.length, line.id).toBeGreaterThanOrEqual(2);
      for (const p of prompts) {
        expect(p.prompt.length, line.id).toBeGreaterThan(20);
        expect(p.answer.length, line.id).toBeGreaterThan(80);
        expect(p.answer.includes('—'), line.id).toBe(false);
      }
    }
  });
});

describe('readiness', () => {
  const cleared = (over: Partial<SaveData['levels'][keyof SaveData['levels']]> = {}) => {
    const save = emptySave();
    save.levels[LINES[0].id] = { cleared: true, box: 0, due: NOW + DAY, trips: 1, tier: 1, best: {}, ...over };
    return save;
  };

  it('is zero for a line you have not cleared', () => {
    expect(lineReadiness(LINES[0], emptySave(), NOW)).toBe(0);
  });

  it('rises with tier and with the review box', () => {
    const basic = lineReadiness(LINES[0], cleared(), NOW);
    const harder = lineReadiness(LINES[0], cleared({ tier: 3 }), NOW);
    const deeper = lineReadiness(LINES[0], cleared({ box: 4, due: NOW + 30 * DAY }), NOW);
    expect(basic).toBeGreaterThan(0);
    expect(harder).toBeGreaterThan(basic);
    expect(deeper).toBeGreaterThan(basic);
    expect(lineReadiness(LINES[0], cleared({ tier: 3, box: 4, due: NOW + 30 * DAY }), NOW)).toBeLessThanOrEqual(1);
  });

  it('slides as a review goes overdue, but never to zero', () => {
    const save = cleared({ box: 1, due: NOW });
    const fresh = lineReadiness(LINES[0], save, NOW);
    const late = lineReadiness(LINES[0], save, NOW + 2 * DAY);
    const ancient = lineReadiness(LINES[0], save, NOW + 400 * DAY);
    expect(late).toBeLessThan(fresh);
    expect(ancient).toBeLessThan(late);
    // You get rusty, you do not wipe. Half of what you proved survives.
    expect(ancient).toBeCloseTo(fresh / 2, 5);
  });

  it('reports a whole division as a percentage', () => {
    expect(readinessOf(LINES, emptySave(), NOW)).toBe(0);
    expect(readinessOf([LINES[0]], cleared({ tier: 3, box: 4, due: NOW + 30 * DAY }), NOW)).toBeGreaterThan(50);
  });
});

describe('derailing', () => {
  it('costs XP on a line ride', () => {
    const save = { ...emptySave(), xp: 2000 };
    expect(finishDerail(save, { drill: false })).toMatchObject({ cost: DERAIL_COST });
    expect(finishDerail(save, { drill: false }).save.xp).toBe(2000 - DERAIL_COST);
  });

  it('costs nothing on a drill', () => {
    const save = { ...emptySave(), xp: 2000 };
    expect(finishDerail(save, { drill: true })).toMatchObject({ cost: 0 });
    expect(finishDerail(save, { drill: true }).save.xp).toBe(2000);
  });

  it('never demotes you below the rank you hold', () => {
    const at = RANKS[2][0];
    expect(rankFloor(at + 10)).toBe(at);
    const { save, cost } = finishDerail({ ...emptySave(), xp: at + 10 }, { drill: false });
    expect(cost).toBe(10);
    expect(save.xp).toBe(at);
    // and sitting exactly on a floor costs nothing at all
    expect(finishDerail({ ...emptySave(), xp: at }, { drill: false }).cost).toBe(0);
    expect(finishDerail(emptySave(), { drill: false }).save.xp).toBe(0);
  });
});

describe('flow hints', () => {
  it('stays quiet on a first miss at every tier', () => {
    for (const t of [1, 2, 3] as Tier[]) expect(revealAfterMiss(t, 1)).toBe(false);
  });

  it('names the step on a second miss, but only on Local', () => {
    expect(revealAfterMiss(1, 2)).toBe(true);
    expect(revealAfterMiss(2, 2)).toBe(false);
    expect(revealAfterMiss(3, 9)).toBe(false);
  });
});

describe('mixed runs', () => {
  const base = LINES.find(l => l.kind === 'quiz')!;
  const flow: Flow = { t: 2, title: 'f', steps: ['a', 'b', 'c'], note: 'n' };
  const sort = { t: 1 as const, title: 's', buckets: ['X', 'Y'], items: [{ name: 'one', bucket: 'X', why: 'w' }], note: 'n' };

  it('ends on nothing when the line has no puzzles', () => {
    expect(pickPuzzle({ ...base, flows: undefined, sorts: undefined }, 3)).toBeNull();
  });

  it('only offers puzzles unlocked at this tier', () => {
    const line = { ...base, flows: [flow], sorts: undefined };
    expect(pickPuzzle(line, 1)).toBeNull();
    expect(pickPuzzle(line, 2)).toEqual({ kind: 'flow', flow });
  });

  it('gives a run that ends on a puzzle one more heart', () => {
    expect(heartsFor({ ...base, flows: undefined, sorts: undefined }, 1)).toBe(3);
    expect(heartsFor({ ...base, flows: undefined, sorts: [sort] }, 1)).toBe(4);
    // not unlocked at this tier yet, and drills never end on a puzzle
    expect(heartsFor({ ...base, flows: [flow], sorts: undefined }, 1)).toBe(3);
    expect(heartsFor({ ...base, sorts: [sort], preset: true }, 1)).toBe(3);
  });

  it('rotates through the puzzles ride by ride, so replays do not repeat the last stop', () => {
    const line = { ...base, flows: [flow], sorts: [sort] };
    const seen = [0, 1, 2, 3].map(turn => pickPuzzle(line, 3, () => 0, turn)?.kind);
    expect(seen).toEqual(['flow', 'sort', 'flow', 'sort']);
  });

  it('draws from flows and sorts together', () => {
    const line = { ...base, flows: [flow], sorts: [sort] };
    expect(pickPuzzle(line, 3, () => 0)).toEqual({ kind: 'flow', flow });
    expect(pickPuzzle(line, 3, () => 0.99)).toEqual({ kind: 'sort', sort });
  });
});

describe('daily ride pick', () => {
  it('is stored by line id, so adding lines cannot move it', () => {
    const save = emptySave();
    const idx = ensureDailyPick(save, NOW);
    expect(save.dailyPick).toEqual({ day: dayKey(NOW), id: LINES[idx].id });
    // same day, same answer
    expect(ensureDailyPick(save, NOW)).toBe(idx);
  });

  it('drops an old index-based pick instead of trusting it', () => {
    const old = { ...emptySave(), dailyPick: { day: dayKey(NOW), idx: 3 } } as unknown;
    expect(migrate(old).dailyPick).toBeUndefined();
  });
});
