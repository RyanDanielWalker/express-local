import { describe, expect, it } from 'vitest';
import { GUIDE, LINES } from './index';
import { DIVISIONS } from '../engine/questions';

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

  it('only offers questions whose answer is one of the options', () => {
    for (const line of LINES) {
      for (const q of line.questions ?? []) {
        expect(q.opts, `${line.id}: ${q.q}`).toContain(q.a);
        expect(q.opts.length, `${line.id}: ${q.q}`).toBeGreaterThanOrEqual(2);
        expect(new Set(q.opts).size, `${line.id}: ${q.q}`).toBe(q.opts.length);
      }
      for (const f of line.flows ?? []) {
        expect(new Set(f.steps).size, `${line.id}: ${f.title}`).toBe(f.steps.length);
        expect(f.steps.length, `${line.id}: ${f.title}`).toBeGreaterThan(2);
      }
      for (const q of line.quiz ?? []) {
        expect(q.opts, `${line.id} code check`).toContain(q.a);
        expect(q.code, `${line.id} code check`).toContain('___');
      }
    }
  });

  it('keeps em dashes out of player-facing copy', () => {
    const copy = LINES.flatMap(l => [l.pitch, l.hook, ...l.rules, ...(l.questions ?? []).flatMap(q => [q.q, q.why, ...q.opts])]);
    expect(copy.filter(t => t.includes('—'))).toEqual([]);
  });
});
