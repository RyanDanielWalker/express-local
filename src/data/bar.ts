import { FLOWS_PER_RUN, QUESTIONS_PER_RUN } from '../engine/questions';
import type { Division, Guide, Line, Question, Tier } from '../engine/types';

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
 * The most a line's answers may sit in one length position. With three
 * options, each position (longest, middle, shortest) gets the answer about a
 * third of the time by chance. Over half means a rule like "pick the longest"
 * or "pick the middle one" beats knowing the material.
 */
export const MAX_POSITION_SHARE = 0.5;

export type LengthPosition = 'longest' | 'middle' | 'shortest';

/**
 * Where the answer sits when the options are sorted by length, or null when a
 * tie means no length rule could pick it out.
 */
export function lengthPosition(q: Question): LengthPosition | null {
  const lens = q.opts.map(o => o.length);
  const a = q.a.length;
  const only = (n: number) => lens.filter(x => x === n).length === 1;
  const hi = Math.max(...lens);
  const lo = Math.min(...lens);
  if (a === hi && only(a)) return 'longest';
  if (a === lo && only(a)) return 'shortest';
  // A "middle" rule only works with exactly three options, all different lengths.
  if (q.opts.length === 3 && a > lo && a < hi && only(hi) && only(lo)) return 'middle';
  return null;
}

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

  // Where the answer sits by length. If one position holds it on more than
  // half the questions, a length rule beats knowing the material.
  const pool = line.questions ?? [];
  const counts: Record<LengthPosition, number> = { longest: 0, middle: 0, shortest: 0 };
  for (const q of pool) {
    const pos = lengthPosition(q);
    if (pos) counts[pos]++;
  }
  const [worst, hits] = (Object.entries(counts) as [LengthPosition, number][]).sort((x, y) => y[1] - x[1])[0];
  const tilted = pool.length > 0 && hits / pool.length > MAX_POSITION_SHARE;

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
      detail: tilted ? `answer is the ${worst} option on ${hits}/${pool.length}` : '',
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
