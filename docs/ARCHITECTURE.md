# Architecture

How Express & Local works today. If a change makes any of this untrue, the same commit fixes this file.

## The shape of it

A single-page React 19 app built with Vite. There is no backend. Everything the player does is saved in the browser's `localStorage`, and a save code (Base64 of the save) moves progress between browsers. See [ADR 0003](adr/0003-stack.md).

```
src/
  algorithms/   pure game logic for the algorithm lines, as small state machines, with tests
  engine/       types, save data, progression and scoring, question picking, readiness, with tests
  data/         all the content, one file per division, plus the quality bar and content tests
  games/        one component per algorithm line, plus QuizRun, QuizGame, FlowGame and SortGame
  components/   screens and shared UI: header, map, intro, play screen, results, rehearsal, badges
  hooks/        useKeys (keyboard shortcuts), useTimers (timers cleaned up on unmount)
  lib/          small helpers (random picks and shuffles, station labels)
  styles/       one stylesheet, app.css
probes/         sandboxes that prove the content against real code (not part of the app)
```

Three rules hold the code together:

1. **Game rules are pure.** Anything that decides what is correct lives in `src/algorithms/` or `src/engine/` as plain functions with tests. Components ask, and render what comes back.
2. **Scoring is pure.** `finishTrip()`, `finishCram()`, `finishRehearsal()` and `finishDerail()` in `engine/progression.ts` take a save and what happened, and return a new save plus everything the results screen shows. Readiness is computed from the save, never stored.
3. **Content is data.** Every question, puzzle and field guide is a typed object in `src/data/`. Adding a topic means writing data, not components. See [ADR 0004](adr/0004-content-as-typed-data.md).

## The words the code uses

The subway theme runs through the names ([ADR 0001](adr/0001-subway-theme.md)), so here is the map:

| Word                  | What it is                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Division**          | A subject area: `algos`, `nest`, `react`, `ts`. Each has its own row on the map and unlocks on its own. Listed in `DIVISIONS` in `engine/questions.ts`. |
| **Line**              | One topic inside a division, like Side Track (React effects). The `Line` type in `engine/types.ts`. Shown on the map as a stop with a bullet.           |
| **Tier**              | How hard a ride is: 1 Local, 2 Express, 3 Rush Hour. Local asks 6 questions, Express 8, Rush Hour 10 and turns the helper panels off.                   |
| **Ride, trip, run**   | One play of a line at a tier.                                                                                                                           |
| **Question**          | A multiple-choice item in a line's pool. `t` is the lowest tier it can appear on.                                                                       |
| **Puzzle, last stop** | The sort or flow a quiz run ends on.                                                                                                                    |
| **Sort**              | Put each card in the right box.                                                                                                                         |
| **Flow**              | Put steps in the order they actually run. Decoys are steps that do not happen in that scenario.                                                         |
| **Field guide**       | The study notes for a line: plain intro, vocabulary, a code example, talking points, the gotcha, and rehearsal prompts. The `Guide` type.               |
| **Rehearse**          | Answer a prompt out loud, then compare with the model answer.                                                                                           |
| **Station**           | Only in the algorithm games: a node in a graph you click through.                                                                                       |
| **The bar**           | The checks a line has to pass to count as done. See below.                                                                                              |

## How content is structured

Each division has one data file that exports its lines and its guides:

| Division   | Lines                             | Guides                         |
| ---------- | --------------------------------- | ------------------------------ |
| Algorithms | `data/lines.ts` (`ALGO_LINES`)    | `data/guide.ts` (`ALGO_GUIDE`) |
| NestJS     | `data/nest.ts` (`NEST_LINES`)     | same file (`NEST_GUIDE`)       |
| React      | `data/react.ts` (`REACT_LINES`)   | same file (`REACT_GUIDE`)      |
| TypeScript | `data/typescript.ts` (`TS_LINES`) | same file (`TS_GUIDE`)         |

`data/index.ts` merges them into `LINES` (map order) and `GUIDE` (keyed by line id).

### A line

The full type is `Line` in `engine/types.ts`. The fields that matter most:

- `id`, `division`, `kind`: identity and how it plays. `kind` is `'game'` (a hand-built algorithm game), `'quiz'` (questions, then a puzzle), or `'flow'` (a run of ordering puzzles; NestJS's Main Line is the only one).
- `bullet`, `color`, `darkText`: the map badge. Bullets are unique inside a division. Colors are CSS custom properties like `--orange`; light colors need `darkText`.
- `short`, `name`, `topic`, `pitch`: the labels and the one-paragraph sell on the intro screen.
- `rules`: three short "how to ride" lines. `hook`: the "remember it" summary, shown on the intro screen only, because it is close to an answer key. `drill`: how to reason it out, shown beside the questions during play.
- `par`: the Rush Hour par time, in seconds.
- `questions`, `sorts`, `flows`: the pools.

### A question

```ts
{
  t: 1,                                  // lowest tier it appears on
  q: 'What does `as User` actually do?', // supports `code` and **bold**
  code: '...',                           // optional code block
  opts: ['...', '...', '...'],           // three options, written as parallel claims
  a: '...',                              // the right option, matched by exact text
  why: '...',                            // why the right one is right and the tempting one is wrong
}
```

A question's identity is its line id plus a hash of its `q` and `code` (`qid()` in `engine/questions.ts`). The player's history for a question (seen, missed, shaky) is keyed by it. So rewording `q` or `code`, or moving the question to another line, starts its history over. Editing options or `why` does not.

### Puzzles and guides

- `Sort`: `title`, `buckets`, `items` (each `{ name, bucket, why }`), and a `note` shown after.
- `Flow`: `title`, `steps` in the right order, optional `decoys`, optional `start` (how many steps are already placed), and a `note`.
- `Guide`: `plain` (a blank line starts a new paragraph), `words` (term and definition pairs), `code` (`label` and `snippet`), `say` (talking points), `gotcha`, and `rehearse` (prompt and model answer pairs). Algorithm guides also have `when`, `famous` and `lore`.

Copy everywhere supports `` `code` `` and `**bold**`, rendered by `<Rich />`. Longer copy goes through `<Prose />`. Sort card names render as plain text, so they never contain backticks.

## How a ride works in the code

`App.tsx` is a small screen state machine: map, intro, play, results (or derailed). It also runs the cram drill, the shaky drill and rehearsal, none of which change line progress.

1. **Pick.** `pickQuestions()` draws the tier's questions, putting unseen and shaky ones first. `pickPuzzle()` picks the last stop and rotates it from ride to ride.
2. **Play.** `PlayScreen` owns hearts, XP and the clock. `QuizRun` plays the questions through `QuizGame`, then the puzzle through `SortGame` or `FlowGame`. Algorithm lines play their own component from `games/index.ts`. Every game gets a `GameApi` (`say`, `correct`, `wrong`, `record`, `hold`, `resume`, `finish`, `tier`, `assist`, `over`).
3. **Score.** `finishTrip()` returns the new save: tier cleared, the next review date (Leitner boxes at 1, 3, 7, 14 and 30 days), XP, streak, badges and personal bests. `recordAnswers()` updates per-question history.
4. **Show.** `Results` renders what `finishTrip()` returned.

Readiness (the headline number per division) comes from `readinessReport()`: what is cleared, at which tier, how far along its reviews, and how much of the question pool is solid. It decays as reviews go overdue.

## Saves

`engine/save.ts` defines `SaveData`, `emptySave()` and `migrate()`. Saves refer to lines by id, never by position, so lines can be added anywhere. A new save field needs a default in `emptySave()` and handling in `migrate()`, so old saves keep loading. Unlock order is the order of lines inside a division.

## What keeps content from shipping broken

All of it runs on every `npm test`:

- **TypeScript types.** `Line`, `Question`, `Sort`, `Flow` and `Guide` are typed, so a missing or misnamed field fails `npm run typecheck`. Each division's ids are a union type (`ReactLineId` and friends), so a typo in an id fails too.
- **`data/data.test.ts`** checks every line: unique ids and bullets, a guide and par for every line, the content each kind needs, every answer among its options, no answer 1.35x longer than its distractors, flows solvable and varied, sorts solvable with no card named after its own box, no em dashes in player-facing copy or field guides, and question ids unique inside a line.
- **`data/bar.ts` and `bar.test.ts`** are the quality bar from [the roadmap](ROADMAP.md#the-bar): every tier can fill a run with 1.5x room to vary, two puzzles on Local, three rehearsal prompts, talking points and a gotcha, a puzzle beyond recognition, and no length position (longest, middle or shortest) holding the answer on more than half a line's questions. Divisions in `FINISHED` fail the tests if any line slips. `npm run bar` prints where every line stands.
- **`components/results.test.tsx`** renders the results screen for every line.

What the tests cannot check is whether a claim is true. That is what `probes/` and the fact-check pass are for. See [DEVELOPMENT.md](DEVELOPMENT.md#checking-content).

## Adding content

### A question to an existing line

1. Prove the claim, and every wrong option, in `probes/` (see [DEVELOPMENT.md](DEVELOPMENT.md#checking-content)).
2. Search the other lines for a question that already tests the same fact. If there is one, take a different angle.
3. Add it to the line's `questions` array in its division file.
4. Run `npm test` and `npm run bar`. If the length check complains, rewrite the options as parallel claims rather than padding the wrong ones.

### A puzzle

Add a `Sort` or `Flow` to the line's `sorts` or `flows`. For a flow, check the order against a real run in a probe, and make sure no step could honestly go in two places.

### A line

1. Add its id to the division's id type in `engine/types.ts` (`NestLineId`, `ReactLineId`, `TsLineId` or `AlgoLineId`).
2. Add the line to the division's lines array, and its guide entry to the division's guide object. Pick a bullet and color not already used in that division.
3. Give it at least 9 / 12 / 15 questions available on Local / Express / Rush Hour, two Local puzzles, three rehearsal prompts, talking points and a gotcha.
4. A `kind: 'game'` line also needs pure logic with tests in `src/algorithms/` and a component registered in `games/index.ts`.
5. Consider badges in `engine/progression.ts` if the line joins a group, and add the line to the README's tables.

### A division

Add it to `Division` in `engine/types.ts`, give it its own id union (like `ReactLineId`) and add that union to `LineId`, add an entry in `DIVISIONS` in `engine/questions.ts`, a data file merged in `data/index.ts`, and a section in the README. Add it to `FINISHED` in `data/bar.ts` only once it could carry an interview on its own topic.
