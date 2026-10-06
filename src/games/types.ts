import type { ReactNode } from 'react';
import type { Line, Question, Tier } from '../engine/types';

export type Tone = 'good' | 'bad' | '';

/** What the play screen hands every game. Games own the rules, the play screen owns hearts, XP, and the clock. */
export interface GameApi {
  tier: Tier;
  /** Helpers (queue panels, pointers, tables) are on for Local and Express, off for Rush Hour. */
  assist: boolean;
  /** True once the trip is finished or out of hearts. Check before acting on input. */
  readonly over: boolean;
  say(msg: ReactNode, tone?: Tone): void;
  /** Report one answered question so the run can track weak spots. */
  record(question: Question, correct: boolean): void;
  correct(points?: number, msg?: ReactNode): void;
  wrong(msg: ReactNode): void;
  /** Stop the clock while the player reads. Reading an explanation should not cost par time. */
  hold(): void;
  /** Start it again. Safe to call when it was never held. */
  resume(): void;
  finish(): void;
}

export interface GameProps {
  api: GameApi;
  /** The line being played, so data-driven games can read their own pool. */
  line: Line;
}
