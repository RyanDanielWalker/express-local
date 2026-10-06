import { shuffle } from '../lib/random';
import type { Division, Flow, Question, Tier } from './types';

export const DIVISIONS: { id: Division; name: string; blurb: string }[] = [
  { id: 'algos', name: 'Algorithms', blurb: 'Be the algorithm. Click it out stop by stop.' },
  { id: 'nest', name: 'NestJS', blurb: 'The backend half of the job, drilled as questions.' },
  { id: 'react', name: 'React', blurb: 'Rendering, effects and state, the parts that bite.' },
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
