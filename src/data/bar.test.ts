import { describe, expect, it } from 'vitest';
import { DIVISIONS } from '../engine/questions';
import type { Guide, Line, Question } from '../engine/types';
import { auditLine, barReport, clears, FINISHED } from './bar';
import { GUIDE, LINES } from './index';

/**
 * The bar from ROADMAP.md, as a ratchet. Finished divisions are enforced;
 * everything else is reported when you ask (BAR=1, or `npm run bar`).
 */
describe('the bar', () => {
  for (const d of FINISHED) {
    it(`keeps ${d} finished`, () => {
      for (const line of LINES.filter(l => l.division === d)) {
        const misses = auditLine(line, GUIDE[line.id]).filter(c => !c.ok);
        expect(misses.map(c => `${c.label}: ${c.detail}`), `${line.id} slipped below the bar`).toEqual([]);
      }
    });
  }

  it('reports where every division stands', () => {
    const report = barReport(LINES, GUIDE, DIVISIONS);
    // No Node types in this project's tsconfig, so reach for the env the long way.
    const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
    if (env?.BAR) console.log(`\n${report}\n`);
    expect(report.length).toBeGreaterThan(0);
  });
});

describe('the auditor', () => {
  const q = (t: 1 | 2 | 3, n: number): Question[] =>
    Array.from({ length: n }, (_, i) => ({ t, q: `q${t}-${i}`, opts: ['a', 'b'], a: 'a', why: 'because' }));
  const base = { division: 'nest' as const, bullet: 'Z', color: '--red', short: 's', name: 'n', topic: 't', pitch: 'p', rules: ['r'], hook: 'h', par: 60 };
  const quiz = (questions: Question[], extra: Partial<Line> = {}): Line => ({ ...base, id: 'di', kind: 'quiz', questions, ...extra });
  const guide = (prompts: number, extra: Partial<Guide> = {}): Guide => ({
    plain: 'p',
    words: [],
    code: { label: 'l', snippet: 's' },
    say: ['one'],
    gotcha: 'g',
    rehearse: Array.from({ length: prompts }, (_, i) => ({ prompt: `p${i}`, answer: 'a' })),
    ...extra,
  });
  const full = [...q(1, 9), ...q(2, 3), ...q(3, 3)];
  const flow = (t: 1 | 2 | 3 = 1) => ({ t, title: `x${t}`, steps: ['a', 'b'], note: 'n' });

  it('fails a line that cannot fill a Local run, and says by how much', () => {
    const runs = auditLine(quiz([...q(1, 3), ...q(2, 5), ...q(3, 2)]), guide(3)).find(c => c.id === 'runs')!;
    expect(runs.ok).toBe(false);
    expect(runs.detail).toBe('T1 3/6');
  });

  it('fails a line whose pool is no bigger than a run, so every replay is the same', () => {
    const variety = auditLine(quiz([...q(1, 6), ...q(2, 2), ...q(3, 2)], { flows: [flow(), flow()] }), guide(3))
      .find(c => c.id === 'variety')!;
    expect(variety.ok).toBe(false);
    expect(variety.detail).toBe('T1 6/9 T2 8/12 T3 10/15');
  });

  it('wants two puzzles on Local, so back-to-back rides end differently', () => {
    const variety = (flows: ReturnType<typeof flow>[]) => auditLine(quiz(full, { flows }), guide(3)).find(c => c.id === 'variety')!;
    expect(variety([flow(), flow(2)]).detail).toBe('1/2 Local puzzles');
    expect(variety([flow(), flow()]).ok).toBe(true);
  });

  it('wants three rehearsal prompts, talking points and a gotcha', () => {
    const checks = auditLine(quiz(full), guide(2, { gotcha: undefined }));
    expect(checks.find(c => c.id === 'rehearse')!.ok).toBe(false);
    expect(checks.find(c => c.id === 'guide')!.detail).toBe('no gotcha');
  });

  it('fails a line where the longest option is usually right', () => {
    const tilted = (n: number): Question[] => Array.from({ length: n }, (_, i) => ({
      t: 1 as const, q: `q${i}`, opts: ['the long right answer', 'short', 'brief'], a: 'the long right answer', why: 'because',
    }));
    const line = quiz([...tilted(9), ...q(2, 3), ...q(3, 3)], { flows: [flow(), flow()] });
    const tells = auditLine(line, guide(3)).find(c => c.id === 'tells')!;
    expect(tells.ok).toBe(false);
    expect(tells.detail).toBe('answer is the longest option on 9/15');
  });

  it('does not count recognition alone as judgment', () => {
    expect(auditLine(quiz(full), guide(3)).find(c => c.id === 'judgment')!.ok).toBe(false);
    const withFlow = quiz(full, { flows: [flow(), flow()] });
    expect(clears(auditLine(withFlow, guide(3)))).toBe(true);
  });
});
