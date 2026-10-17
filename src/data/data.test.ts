import { describe, expect, it } from 'vitest';
import { GUIDE, LINES } from './index';
import { DIVISIONS, qid } from '../engine/questions';

/** Content is data, and data goes stale quietly. These catch the typos. */
describe('line data', () => {
  it('has unique ids and bullets inside each division', () => {
    expect(new Set(LINES.map(l => l.id)).size).toBe(LINES.length);
    for (const d of DIVISIONS) {
      const bullets = LINES.filter(l => l.division === d.id).map(l => l.bullet);
      expect(new Set(bullets).size).toBe(bullets.length);
    }
  });

  it('gives every line a field guide and a par time', () => {
    for (const line of LINES) {
      expect(GUIDE[line.id], line.id).toBeTruthy();
      expect(GUIDE[line.id].plain.length, line.id).toBeGreaterThan(80);
      expect(line.par, line.id).toBeGreaterThan(0);
      expect(line.rules.length, line.id).toBeGreaterThan(0);
    }
  });

  it('gives every line the content its kind needs', () => {
    for (const line of LINES) {
      if (line.kind === 'quiz') expect(line.questions?.length ?? 0, line.id).toBeGreaterThanOrEqual(6);
      if (line.kind === 'flow') expect(line.flows?.length ?? 0, line.id).toBeGreaterThanOrEqual(2);
      if (line.kind === 'game') expect(line.quiz?.length ?? 0, line.id).toBeGreaterThan(0);
      // a tier 1 run has to have something to ask
      if (line.kind === 'quiz') expect(line.questions!.some(q => q.t === 1), line.id).toBe(true);
      if (line.kind === 'flow') expect(line.flows!.some(f => f.t === 1), line.id).toBe(true);
    }
  });

  // History is keyed by qid(), a hash of the question text and code. Two
  // questions with the same text and code in one line would share a history.
  it('gives every question in a line its own id', () => {
    for (const line of LINES) {
      const ids = (line.questions ?? []).map(q => qid(line.id, q));
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dupes, line.id).toEqual([]);
    }
  });

  it('only offers questions whose answer is one of the options', () => {
    for (const line of LINES) {
      for (const q of line.questions ?? []) {
        expect(q.opts, `${line.id}: ${q.q}`).toContain(q.a);
        expect(q.opts.length, `${line.id}: ${q.q}`).toBeGreaterThanOrEqual(2);
        expect(new Set(q.opts).size, `${line.id}: ${q.q}`).toBe(q.opts.length);
      }
      for (const f of line.flows ?? []) {
        expect(new Set(f.steps).size, `${line.id}: ${f.title}`).toBe(f.steps.length);
        // What makes a flow a puzzle is choices against options, not length: a
        // two-step run surrounded by decoys is harder than a four-step run alone.
        expect(f.steps.length - (f.start ?? 0), `${line.id}: ${f.title}`).toBeGreaterThan(1);
        const tray = f.steps.length - (f.start ?? 0) + (f.decoys?.length ?? 0);
        expect(tray, `${line.id}: ${f.title} is too small to be a puzzle`).toBeGreaterThan(3);
      }
      for (const q of line.quiz ?? []) {
        expect(q.opts, `${line.id} code check`).toContain(q.a);
        expect(q.code, `${line.id} code check`).toContain('___');
      }
    }
  });

  it('does not let option length give the answer away', () => {
    // Picking the longest option should not be a winning strategy.
    const questions = LINES.flatMap(l => l.questions ?? []);
    let longest = 0;
    for (const q of questions) {
      const others = q.opts.filter(o => o !== q.a).map(o => o.length);
      const avgOther = others.reduce((a, b) => a + b, 0) / others.length;
      const ratio = q.a.length / avgOther;
      expect(ratio, `answer is ${ratio.toFixed(2)}x the distractors: ${q.q.slice(0, 60)}`).toBeLessThan(1.35);
      const lens = q.opts.map(o => o.length);
      const max = Math.max(...lens);
      if (q.a.length === max && lens.filter(x => x === max).length === 1) longest++;
    }
    // With three options, chance alone would be about a third.
    expect(longest / questions.length).toBeLessThan(0.55);
  });

  it('keeps flow puzzles solvable and varied', () => {
    for (const line of LINES.filter(l => l.kind === 'flow')) {
      for (const f of line.flows ?? []) {
        if (f.start !== undefined) {
          expect(f.start, `${line.id}: ${f.title}`).toBeGreaterThan(0);
          // A mid-flight start still has to leave a puzzle behind.
          expect(f.steps.length - f.start, `${line.id}: ${f.title}`).toBeGreaterThanOrEqual(3);
        }
        for (const d of f.decoys ?? []) {
          expect(f.steps, `${line.id}: ${d} is both a step and a decoy`).not.toContain(d);
        }
      }
      // If every run opens the same way, the first clicks are muscle memory, not recall.
      const openings = (line.flows ?? []).filter(f => f.t === 1).map(f => f.steps.slice(0, 2).join(' > '));
      expect(new Set(openings).size, `${line.id} tier 1 flows all open the same way`).toBeGreaterThan(1);
    }
  });

  it('does not hand a flow line its own answer', () => {
    // The side panel shows `drill` while you play, because `hook` IS the order.
    for (const line of LINES.filter(l => l.kind === 'flow')) {
      expect(line.drill, line.id).toBeTruthy();
      const steps = (line.flows ?? []).flatMap(f => f.steps);
      const leaked = steps.filter(s => line.drill!.toLowerCase().includes(s.toLowerCase()));
      expect(leaked, `${line.id} drill names its own steps`).toEqual([]);
    }
  });

  it('keeps sort puzzles solvable and honest', () => {
    for (const line of LINES) {
      for (const sort of line.sorts ?? []) {
        const at = `${line.id}: ${sort.title}`;
        expect(sort.buckets.length, at).toBeGreaterThanOrEqual(2);
        expect(sort.items.length, at).toBeGreaterThanOrEqual(4);
        expect(new Set(sort.items.map(i => i.name)).size, `${at} has duplicate cards`).toBe(sort.items.length);
        for (const item of sort.items) {
          expect(sort.buckets, `${at}: ${item.name} points at a missing box`).toContain(item.bucket);
          expect(item.why.length, `${at}: ${item.name} needs a why`).toBeGreaterThan(20);
          // The option-length rule, for sorts: a card named after its own box is free.
          const key = item.bucket.split(' ')[0].toLowerCase();
          expect(item.name.toLowerCase(), `${at}: "${item.name}" gives away "${item.bucket}"`).not.toContain(key);
        }
        // Every box should be the answer at least once, or it is just a decoy with a heading.
        for (const b of sort.buckets) expect(sort.items.some(i => i.bucket === b), `${at}: nothing goes in ${b}`).toBe(true);
      }
    }
  });

  it('keeps em dashes out of player-facing copy', () => {
    const copy = LINES.flatMap(l => [
      l.pitch, l.hook, l.drill ?? '', ...l.rules,
      ...(l.questions ?? []).flatMap(q => [q.q, q.why, ...q.opts]),
      ...(l.flows ?? []).flatMap(f => [f.title, f.note, ...f.steps, ...(f.decoys ?? [])]),
      ...(l.sorts ?? []).flatMap(s => [s.title, s.note, ...s.buckets, ...s.items.flatMap(i => [i.name, i.why])]),
    ]);
    const guides = Object.values(GUIDE).flatMap(g => [
      g.plain, g.gotcha ?? '', g.lore ?? '', g.code.label, g.code.snippet, g.code.note ?? '',
      ...g.words.flat(), ...(g.say ?? []), ...(g.when ?? []), ...(g.famous ?? []),
      ...(g.rehearse ?? []).flatMap(r => [r.prompt, r.answer]),
    ]);
    copy.push(...guides);
    expect(copy.filter(t => t.includes('—'))).toEqual([]);
  });
});
