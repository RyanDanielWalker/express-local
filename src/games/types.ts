import type { ReactNode } from 'react';
import type { Line, Tier } from '../engine/types';

export type Tone = 'good' | 'bad' | '';

/** What the play screen hands every game. Games own the rules, the play screen owns hearts, XP, and the clock. */
export interface GameApi {
  tier: Tier;
  /** Helpers (queue panels, pointers, tables) are on for Local and Express, off for Rush Hour. */
  assist: boolean;
  /** True once the trip is finished or out of hearts. Check before acting on input. */
  readonly over: boolean;
  say(msg: ReactNode, tone?: Tone): void;
  correct(points?: number, msg?: ReactNode): void;
  wrong(msg: ReactNode): void;
  finish(): void;
}

export interface GameProps {
  api: GameApi;
  /** The line being played, so data-driven games can read their own pool. */
  line: Line;
}
