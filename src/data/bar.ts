import { FLOWS_PER_RUN, QUESTIONS_PER_RUN } from '../engine/questions';
import type { Division, Guide, Line, Tier } from '../engine/types';

/**
 * Divisions declared finished. Every line in one of these has to clear the
 * bar or the tests fail, so "done" is something the repo defends rather than
 * something we remember. Add a division here only once it could carry an
 * interview on its own topic; that half of the bar is a judgment call, not a
 * check.
 */
export const FINISHED: Division[] = ['nest'];

export interface BarCheck {
  id: 'runs' | 'variety' | 'rehearse' | 'guide' | 'judgment' | 'tells';
  label: string;
  ok: boolean;
  /** What is missing, in a few words. */
  detail: string;
}

const TIERS: Tier[] = [1, 2, 3];

/**
 * The share of a line's questions where the answer may be the single longest
 * option. data.test.ts checks this across the whole app, which let individual
 * lines hide behind the average; this checks each line on its own.
 */
export const MAX_LONGEST_SHARE = 0.5;

/**
 * How much bigger than a run a tier's pool has to be. A pool exactly the size
 * of a run makes every replay the same run, so the second ride is a memory
 * test. At 1.5x, a replay still leads with questions you have not seen.
 */
export const VARIETY = 1.5;

/** Puzzles a quiz line needs on Local, so back-to-back rides end differently. */
export const PUZZLES_AT_LOCAL = 2;

/**
 * One line against the bar in ROADMAP.md. Check 5 there (content tests) is
 * mostly enforced for every line by data.test.ts; the one part that has to be
 * judged per line, answers giving themselves away by length, lives here.
 */
export function auditLine(line: Line, guide: Guide | undefined): BarCheck[] {
  // Hand-built games generate their own runs and are judgment puzzles by nature.
  const game = line.kind === 'game';

  const pools = game
    ? []
    : TIERS.map(t => {
        const have = line.kind === 'flow'
          ? (line.flows ?? []).filter(f => f.t <= t).length
          : (line.questions ?? []).filter(q => q.t <= t).length;
        const run = line.kind === 'flow' ? FLOWS_PER_RUN[t] : QUESTIONS_PER_RUN[t];
        return { t, have, run, room: Math.ceil(run * VARIETY) };
      });
  const short = pools.filter(r => r.have < r.run);
  const samey = pools.filter(r => r.have >= r.run && r.have < r.room);
  const localPuzzles = line.kind === 'quiz'
    ? [...(line.flows ?? []), ...(line.sorts ?? [])].filter(p => p.t === 1).length
    : PUZZLES_AT_LOCAL;
  const fewEndings = !line.preset && line.kind === 'quiz' && localPuzzles < PUZZLES_AT_LOCAL;

  const prompts = guide?.rehearse?.length ?? 0;
  const talking = (guide?.say?.length ?? 0) > 0;
  const gotcha = !!guide?.gotcha;
  const puzzles = (line.flows?.length ?? 0) + (line.sorts?.length ?? 0);

  // How often the right answer is the one longest option. With three options,
  // chance is about a third; over half means "pick the longest" beats knowing.
  const pool = line.questions ?? [];
  const longest = pool.filter(q => {
    const lens = q.opts.map(o => o.length);
    const max = Math.max(...lens);
    return q.a.length === max && lens.filter(n => n === max).length === 1;
  }).length;
  const tilted = pool.length > 0 && longest / pool.length > MAX_LONGEST_SHARE;

  return [
    {
      id: 'runs',
      label: 'Fills a run at every tier',
      ok: short.length === 0,
      detail: short.length ? short.map(r => `T${r.t} ${r.have}/${r.run}`).join(' ') : '',
    },
    {
      id: 'variety',
      label: 'Replays differ',
      ok: samey.length === 0 && !fewEndings,
      detail: [
        ...samey.map(r => `T${r.t} ${r.have}/${r.room}`),
        fewEndings && `${localPuzzles}/${PUZZLES_AT_LOCAL} Local puzzles`,
      ].filter(Boolean).join(' '),
    },
    {
      id: 'rehearse',
      label: 'Three rehearsal prompts',
      ok: prompts >= 3,
      detail: prompts >= 3 ? '' : `${prompts}/3`,
    },
    {
      id: 'guide',
      label: 'Talking points and a gotcha',
      ok: talking && gotcha,
      detail: [!talking && 'no talking points', !gotcha && 'no gotcha'].filter(Boolean).join(', '),
    },
    {
      id: 'judgment',
      label: 'A puzzle beyond recognition',
      ok: game || puzzles > 0,
      detail: game || puzzles > 0 ? '' : 'recognition only',
    },
    {
      id: 'tells',
      label: 'Answers not guessable by length',
      ok: !tilted,
      detail: tilted ? `answer is the longest option on ${longest}/${pool.length}` : '',
    },
  ];
}

export const clears = (checks: BarCheck[]): boolean => checks.every(c => c.ok);

/** Plain-text status of every division, for the report test. */
export function barReport(lines: Line[], guides: Record<string, Guide>, divisions: { id: Division; name: string }[]): string {
  const out: string[] = [];
  for (const d of divisions) {
    const mine = lines.filter(l => l.division === d.id);
    if (!mine.length) continue;
    const rows = mine.map(l => ({ l, checks: auditLine(l, guides[l.id]) }));
    const done = rows.filter(r => clears(r.checks)).length;
    const tag = FINISHED.includes(d.id) ? '  [finished, enforced]' : '';
    out.push(`${d.name}: ${done}/${mine.length} lines clear the bar${tag}`);
    for (const { l, checks } of rows) {
      const misses = checks.filter(c => !c.ok).map(c => `${c.id} (${c.detail})`);
      out.push(`  ${l.id.padEnd(9)} ${misses.length ? misses.join(', ') : 'clear'}`);
    }
  }
  return out.join('\n');
}
