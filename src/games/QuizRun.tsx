import { useMemo, useState } from 'react';
import { pickPuzzle } from '../engine/questions';
import { FlowGame } from './FlowGame';
import { QuizGame } from './QuizGame';
import { SortGame } from './SortGame';
import type { GameApi, GameProps } from './types';

/**
 * A quiz line's run: its questions, then one puzzle as the last stop when the
 * line has any at this tier. Recognition first, then something you have to
 * work out, in one run with one set of hearts.
 *
 * The questions get a copy of the api whose `finish` hands over to the puzzle
 * instead of ending the run. Everything else (hearts, clock, XP) is the same
 * object underneath, so the run is still one run.
 */
export function QuizRun({ api, line, history, turn }: GameProps) {
  // Drills hand-pick their questions and never end on a puzzle.
  const [puzzle] = useState(() => (line.preset ? null : pickPuzzle(line, api.tier, Math.random, turn)));
  const [stage, setStage] = useState<'questions' | 'puzzle'>('questions');

  const opener = useMemo<GameApi>(() => {
    if (!puzzle) return api;
    const handoff = Object.create(api) as GameApi;
    handoff.finish = () => setStage('puzzle');
    return handoff;
  }, [api, puzzle]);

  if (!puzzle || stage === 'questions') {
    return <QuizGame key="questions" api={opener} line={line} role={puzzle ? 'opener' : undefined} history={history} />;
  }
  if (puzzle.kind === 'flow') {
    return <FlowGame key="flow" api={api} line={{ ...line, flows: [puzzle.flow] }} role="finale" />;
  }
  return <SortGame key="sort" api={api} line={line} sort={puzzle.sort} role="finale" />;
}
