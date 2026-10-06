# Express & Local

Subway-themed drill for algorithms, NestJS, React and TypeScript. React 19 + TypeScript + Vite, no backend, progress in localStorage.

`ROADMAP.md` is the working board: what's next, parked ideas, the principles this project keeps relearning, and a shipped log. Read it before proposing work, and add to it when an idea comes up that isn't getting built today.

## Commands

- `npm run dev`: dev server
- `npm test`: Vitest (run before every commit)
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: typecheck + production build

## Architecture

- `src/algorithms/`: **pure** game logic as small state machines (`init`, `want/should`, `step` returning `{ ok, state }`). No React, no DOM. Every file gets tests in `algorithms.test.ts`.
- `src/engine/`: save data (`save.ts`, with `migrate()` for old saves), progression and scoring (`progression.ts`, where `finishTrip()` is pure and returns a new save). Tests in `engine.test.ts`.
- `src/data/`: one file per division (`lines.ts` + `guide.ts` for algorithms, `nest.ts`, `react.ts`, `typescript.ts`), merged by `index.ts` into `LINES` and `GUIDE`. New divisions get **appended** to `LINES`: `save.dailyPick` stores an index, so inserting in the middle moves someone's Daily Ride. Copy supports `` `code` `` and `**bold**`, rendered by `<Rich />`. `data.test.ts` validates the content.
- Lines declare a `division` (unlock order is per division) and a `kind`:
  - `game`: a hand-built component in `src/games/`, registered in `games/index.ts`
  - `quiz`: multiple choice drawn from `questions`, played by `QuizGame`
  - `flow`: put `steps` in order, played by `FlowGame`
- `src/engine/questions.ts`: `DIVISIONS`, tier-aware `pickQuestions`/`pickFlows`, the cram pool, and per-question history (`qid`, `recordAnswers`, `shakyQuestions`). Pure, tested.
- `src/games/`: one component per line, registered in `games/index.ts`. Games receive a `GameApi` (`say`, `correct`, `wrong`, `finish`, `tier`, `assist`, `over`) and render a `.board` and a `.side`. The play screen owns hearts, XP, and the clock.
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

- Every question needs its answer among its options, at least two options, and a `why` that teaches rather than restates.
- Tier 1 questions are the ones a junior should get. Tier 3 is the deep cut.
- Keep claims checkable: stack answers follow the current docs, and version-specific behavior says which version.
- Options must not give the answer away by length. `data.test.ts` fails a question whose answer is 1.35x its distractors, or a line where the answer is the longest option more than half the time. Write every option as a parallel claim and put the nuance in `why`.
- Non-algorithm lines need at least two `rehearse` prompts in their guide, written as a full spoken answer.
- Flow lines: the side panel shows `drill` (how to reason it out), never `hook` (which is the answer). Use `start` to open a puzzle mid-flight and `decoys` for steps that do not happen in that run, so the player has to decide what gets skipped. Tier 1 flows must not all open the same way, or the first clicks are muscle memory.
