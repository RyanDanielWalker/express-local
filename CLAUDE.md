# Express & Local

Subway-themed drill for algorithms, NestJS, React and TypeScript. React 19 + TypeScript + Vite, no backend, progress in localStorage.

`ROADMAP.md` is the working board: what's next, parked ideas, the principles this project keeps relearning, and a shipped log. Read it before proposing work, and add to it when an idea comes up that isn't getting built today.

## Commands

- `npm run dev`: dev server
- `npm test`: Vitest (run before every commit)
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: typecheck + production build
- `npm run bar`: where every line stands against the quality bar

## Architecture

- `src/algorithms/`: **pure** game logic as small state machines (`init`, `want/should`, `step` returning `{ ok, state }`). No React, no DOM. Every file gets tests in `algorithms.test.ts`.
- `src/engine/`: save data (`save.ts`, with `migrate()` for old saves), progression and scoring (`progression.ts`, where `finishTrip()` is pure and returns a new save). Tests in `engine.test.ts`.
- `src/data/`: one file per division (`lines.ts` + `guide.ts` for algorithms, `nest.ts`, `react.ts`, `typescript.ts`), merged by `index.ts` into `LINES` and `GUIDE`. Saves refer to lines by id (including the Daily Ride pick), so a line can be added anywhere in its division; unlock order is the order within the division. Copy supports `` `code` `` and `**bold**`, rendered by `<Rich />`; longer copy like a field guide's `plain` intro goes through `<Prose />`, which also turns a blank line into a new paragraph. `data.test.ts` validates the content.
- Lines declare a `division` (unlock order is per division) and a `kind`:
  - `game`: a hand-built component in `src/games/`, registered in `games/index.ts`
  - `quiz`: multiple choice drawn from `questions`, then one puzzle from its `flows` or `sorts` as the last stop. `QuizRun` plays the questions through `QuizGame`, then the puzzle through `FlowGame` or `SortGame`
  - `flow`: put `steps` in order, played by `FlowGame`
- `src/engine/questions.ts`: `DIVISIONS`, tier-aware `pickQuestions` (unseen and shaky questions first) and `pickPuzzle` (rotates by ride count), the cram pool, and per-question history (`qid`, `recordAnswers`, `shakyQuestions`). Pure, tested.
- `src/games/`: one component per line, registered in `games/index.ts`. Games receive a `GameApi` (`say`, `correct`, `wrong`, `record`, `hold`, `resume`, `finish`, `tier`, `assist`, `over`) and render a `.board` and a `.side`. The play screen owns hearts, XP, and the clock.
- `src/components/`: screens and shared UI. `App.tsx` is a small screen state machine: intro → play → quiz → result (or derailed), plus a cram run that scores through `finishCram`, a shaky drill built from `shakyQuestions`, and an out-loud rehearsal (`Rehearse.tsx` → `finishRehearsal`). None of those three touch line progress.
- Styles: one stylesheet, `src/styles/app.css`, built on CSS custom properties with light and dark themes. Line colors are `--red`, `--blue`, etc., exposed to a line's subtree as `--c`.

## Conventions

- Keep game rules out of components. If it decides what's correct, it lives in `src/algorithms/` and has a test.
- Tiers: 1 Local, 2 Express, 3 Rush Hour. `api.assist` is false on Rush Hour; hide helper panels when it is.
- Copy voice: direct, a little funny, plain English. **No em dashes** anywhere in user-facing copy.
- Don't break saves. New save fields need a default in `emptySave()` and handling in `migrate()`.
- Use the timers from `useTimers()` (auto-cleaned on unmount), and `useKeys()` for keyboard shortcuts.

## Adding a line

1. Add the id to `LineId` in `engine/types.ts`.
2. Add the line and its guide entry to its division's data file in `src/data/`.
3. Quiz and flow lines stop there. A `kind: 'game'` line also needs pure logic plus tests in `src/algorithms/` and a component registered in `GAMES`.
4. Consider badges in `engine/progression.ts` if the line joins a group.

A new division also needs an entry in `DIVISIONS` (`engine/questions.ts`).

## Content rules

### Clarity comes first

The point of every line is that the idea clicks and can then be explained out loud in an interview. If a sentence needs reading twice, the sentence failed, not the reader. Ryan understands the concepts; dense wording is what slows him down. Every piece of copy (questions, options, explanations, field guides, puzzle notes, rehearsal answers) follows these:

1. **One idea per sentence.** Split anything held together by a colon or three commas.
2. **Example first, then the name.** Show `if (!user) return;`, then say "that is narrowing." Not the other way around.
3. **Define a term in plain words the first time it matters.** "Discriminant", "falsy", "metatype" and friends get a short definition or get replaced.
4. **Say what actually happens.** "The app crashes" beats "fails at runtime". "TypeScript forgets your check" beats "narrowing does not survive".
5. **Explain both sides.** A `why` says why the right answer is right and why the tempting wrong one is wrong.
6. **Clear, not long.** Cut any word that is not helping. No metaphors that need decoding.

This standard is new as of October 2026. Older lines are being brought up to it one at a time (see ROADMAP.md).

### The rest

- Every question needs its answer among its options, at least two options, and a `why` that teaches rather than restates.
- Tier 1 questions are the ones a junior should get. Tier 3 is the deep cut.
- Keep claims checkable: stack answers follow the current docs, and version-specific behavior says which version.
- Options must not give the answer away by length. `data.test.ts` fails a question whose answer is 1.35x its distractors. The bar fails a line where the answer sits in the same length position (longest, middle or shortest) more than half the time: fixing "always the longest" by padding the wrong answers just moves the giveaway to the middle. Write every option as a parallel claim, vary which one is longest, and put the nuance in `why`.
- Non-algorithm lines need at least three `rehearse` prompts in their guide, written as a full spoken answer.
- The bar: `src/data/bar.ts` audits each line against the checks in ROADMAP.md. Run `npm run bar` to see where every division stands before proposing content work. Add a division to `FINISHED` only once it could carry an interview on its own topic; from then on the tests fail if any of its lines slips below the bar.
- Replays have to differ. The bar wants every tier's pool at least 1.5x a run (9 / 12 / 15 questions for a quiz line) and two puzzles on Local. `pickQuestions` puts unseen and shaky questions first, and `pickPuzzle` rotates by ride count.
- Side panels: during play, quiz and flow lines show `drill` (how to reason it out). `hook` is close to an answer key and belongs on the intro screen, but `QuizGame` falls back to it when a line has no `drill`, so give every line one.
- Flow puzzles: use `start` to open a puzzle mid-flight and `decoys` for steps that do not happen in that run, so the player has to decide what gets skipped. Tier 1 flows must not all open the same way, or the first clicks are muscle memory.
- Sort puzzles: a card's name may not contain the first word of its own box (a test enforces it). Card names render as plain text, so no backticks in them; titles, `why`s and notes are formatted.

### Checking TypeScript claims with the compiler

Rereading is not enough: it missed real errors that `tsc` caught. For every TypeScript line:

1. Write each claim (every question, explanation, puzzle card and field guide example) as code in a scratch probe, with an `Expect<A, B>` type assertion or a `// @ts-expect-error` where something should fail.
2. Prove every **wrong** option is wrong too, not just that the right one is right. A wrong option a knowledgeable person could defend is a bug. The first independent review found two of these that a right-answers-only probe passed.
3. Add one deliberately wrong assertion first and confirm the probe fails, so a pass means something.
4. Run it with `strict` on, then fix the content wherever the compiler disagrees. Version-dependent behavior says which version (for example, inferred type predicates since 5.5), and anything that depends on `strict` or another setting says so.
5. Any later edit to an option, including rebalancing lengths, gets re-proved. Rebalancing once turned a wrong option into a true one.
6. When a division is done, an independent agent that did not write it reviews it, trying to break every claim. Verify each finding before changing anything.
