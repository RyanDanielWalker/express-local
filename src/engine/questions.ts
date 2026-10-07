import { shuffle } from '../lib/random';
import type { Division, Flow, Line, Question, SaveData, Sort, Tier } from './types';

export const DIVISIONS: { id: Division; name: string; blurb: string }[] = [
  { id: 'algos', name: 'Algorithms', blurb: 'Be the algorithm. Click it out stop by stop.' },
  { id: 'nest', name: 'NestJS', blurb: 'The backend half of the job, drilled as questions.' },
  { id: 'react', name: 'React', blurb: 'Rendering, effects and state, the parts that bite.' },
  { id: 'ts', name: 'TypeScript', blurb: 'Narrowing, generics and the types you write all day.' },
];

/** How many questions a run asks at each tier. */
export const QUESTIONS_PER_RUN: Record<Tier, number> = { 1: 6, 2: 8, 3: 10 };

/**
 * Pick a run's worth of questions: only ones unlocked at this tier, shuffled,
 * never repeating inside a run. Falls back to a shorter run if the pool is small.
 */
export function pickQuestions(pool: Question[], tier: Tier, count = QUESTIONS_PER_RUN[tier]): Question[] {
  return shuffle(pool.filter(q => q.t <= tier).slice()).slice(0, count);
}

/** How many ordering puzzles a run asks at each tier. */
export const FLOWS_PER_RUN: Record<Tier, number> = { 1: 2, 2: 3, 3: 4 };

export function pickFlows(pool: Flow[], tier: Tier, count = FLOWS_PER_RUN[tier]): Flow[] {
  return shuffle(pool.filter(f => f.t <= tier).slice()).slice(0, count);
}

/** The step that should be clicked next, or null when the flow is finished. */
export const nextStep = (flow: Flow, placed: string[]): string | null => flow.steps[placed.length] ?? null;

/** The puzzle a quiz line ends on. */
export type Puzzle = { kind: 'flow'; flow: Flow } | { kind: 'sort'; sort: Sort };

/**
 * Pick the one puzzle a quiz line ends on this run, from whatever it offers at
 * this tier. Null when it offers none, and the run is questions only.
 */
export function pickPuzzle(line: Line, tier: Tier, rand: () => number = Math.random): Puzzle | null {
  const pool: Puzzle[] = [
    ...(line.flows ?? []).filter(f => f.t <= tier).map(flow => ({ kind: 'flow' as const, flow })),
    ...(line.sorts ?? []).filter(s => s.t <= tier).map(sort => ({ kind: 'sort' as const, sort })),
  ];
  return pool.length ? pool[Math.floor(rand() * pool.length)] : null;
}

/**
 * Whether a miss should name the step you were looking for.
 *
 * Being told converts the best moment for learning, the one right after you
 * find a gap in your own model, into reading. So the answer stays hidden, with
 * one exception: on Local a second miss on the same slot names it, because
 * being stuck with no way forward teaches nothing either.
 */
export const revealAfterMiss = (tier: Tier, misses: number): boolean => tier === 1 && misses >= 2;

/** How many questions a cram drill asks. */
export const CRAM_SIZE = 12;

/**
 * Mixed questions for a cram drill, pulled from lines the player has opened.
 * Algorithm lines contribute their end-of-run code checks, so every division
 * can show up in the same drill.
 */
export function cramPool(lines: Line[], isOpen: (line: Line, idx: number) => boolean, divisions?: Division[]): Question[] {
  const pool: Question[] = [];
  lines.forEach((line, idx) => {
    if (!isOpen(line, idx)) return;
    if (divisions?.length && !divisions.includes(line.division)) return;
    for (const q of line.questions ?? []) pool.push(q);
    for (const q of line.quiz ?? []) pool.push({ t: 1, from: line.id, q: 'What goes in the blank?', code: q.code, opts: q.opts, a: q.a, why: q.why });
  });
  return pool;
}

/**
 * A cram drill's questions. Up to half the drill is pulled from what you have
 * missed before, so the weak spots keep coming back around.
 */
export function cramQuestions(pool: Question[], count = CRAM_SIZE, shaky: Question[] = []): Question[] {
  const weak = shuffle(shaky.filter(q => pool.includes(q))).slice(0, Math.floor(count / 2));
  const rest = shuffle(pool.filter(q => !weak.includes(q)));
  return shuffle([...weak, ...rest.slice(0, count - weak.length)]);
}

/** Lines that are due for review today, in map order. */
export const dueLines = (lines: Line[], save: SaveData, now = Date.now()): Line[] =>
  lines.filter(l => { const p = save.levels[l.id]; return !!p?.cleared && now >= p.due; });

/* ---------- per-question history ---------- */

/** Stable id for a question, derived from its text so it survives edits elsewhere. */
export function qid(lineId: string, question: Question): string {
  const text = question.q + (question.code ?? '');
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return `${question.from ?? lineId}:${h.toString(36)}`;
}

export interface AnswerRecord {
  lineId: string;
  question: Question;
  correct: boolean;
}

/** Fold a run's answers into the save. Pure: returns a new save. */
export function recordAnswers(save: SaveData, answers: AnswerRecord[], now = Date.now()): SaveData {
  if (!answers.length) return save;
  const next: SaveData = { ...save, questions: { ...save.questions } };
  for (const { lineId, question, correct } of answers) {
    const id = qid(lineId, question);
    const prev = next.questions[id] ?? { seen: 0, missed: 0, last: 0 };
    next.questions[id] = {
      seen: prev.seen + 1,
      // getting it right twice in a row clears it off the shaky list
      missed: correct ? Math.max(0, prev.missed - 1) : prev.missed + 1,
      last: correct ? prev.last : now,
    };
  }
  return next;
}

export interface Shaky {
  lineId: string;
  question: Question;
  missed: number;
  last: number;
}

/** Questions you have missed and not yet recovered, worst first. */
export function shakyQuestions(save: SaveData, lines: Line[], lineId?: string): Shaky[] {
  const out: Shaky[] = [];
  for (const line of lines) {
    if (lineId && line.id !== lineId) continue;
    for (const question of line.questions ?? []) {
      const stat = save.questions[qid(line.id, question)];
      if (stat && stat.missed > 0) out.push({ lineId: line.id, question, missed: stat.missed, last: stat.last });
    }
  }
  return out.sort((a, b) => b.missed - a.missed || b.last - a.last);
}
