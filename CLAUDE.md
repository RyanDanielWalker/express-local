# Express & Local

Subway-themed algorithms game. React 19 + TypeScript + Vite, no backend, progress in localStorage.

## Commands

- `npm run dev`: dev server
- `npm test`: Vitest (run before every commit)
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: typecheck + production build

## Architecture

- `src/algorithms/`: **pure** game logic as small state machines (`init`, `want/should`, `step` returning `{ ok, state }`). No React, no DOM. Every file gets tests in `algorithms.test.ts`.
- `src/engine/`: save data (`save.ts`, with `migrate()` for old saves), progression and scoring (`progression.ts`, where `finishTrip()` is pure and returns a new save). Tests in `engine.test.ts`.
- `src/data/`: `LINES` (line copy, rules, quiz, par time) and `GUIDE` (field guide). Copy supports `` `code` `` and `**bold**`, rendered by `<Rich />`.
- `src/games/`: one component per line, registered in `games/index.ts`. Games receive a `GameApi` (`say`, `correct`, `wrong`, `finish`, `tier`, `assist`, `over`) and render a `.board` and a `.side`. The play screen owns hearts, XP, and the clock.
- `src/components/`: screens and shared UI. `App.tsx` is a small screen state machine: intro → play → quiz → result (or derailed).
- Styles: one stylesheet, `src/styles/app.css`, built on CSS custom properties with light and dark themes. Line colors are `--red`, `--blue`, etc., exposed to a line's subtree as `--c`.

## Conventions

- Keep game rules out of components. If it decides what's correct, it lives in `src/algorithms/` and has a test.
- Tiers: 1 Local, 2 Express, 3 Rush Hour. `api.assist` is false on Rush Hour; hide helper panels when it is.
- Copy voice: direct, a little funny, plain English. **No em dashes** anywhere in user-facing copy.
- Don't break saves. New save fields need a default in `emptySave()` and handling in `migrate()`.
- Use the timers from `useTimers()` (auto-cleaned on unmount), and `useKeys()` for keyboard shortcuts.

## Adding a line

1. Entry in `LINES` (`src/data/lines.ts`) and `GUIDE` (`src/data/guide.ts`); `LineId` in `engine/types.ts`.
2. Pure logic + tests in `src/algorithms/`.
3. Component in `src/games/`, registered in `GAMES`.
4. Consider badges in `engine/progression.ts` if the line joins a group (graphs, sorts).
