# Express & Local

A subway-themed practice app for technical interviews. Ryan, a junior web developer, built it to drill computer science and his stack until he can explain it out loud: NestJS, TypeScript and React, plus algorithms. He is the player, the owner, and the only user.

Four divisions, 34 lines. NestJS, TypeScript and React are finished: every line clears the quality bar, every claim was proven against real code and independently reviewed. Algorithms are parked. Not deployed; it runs locally.

## Where things are

- `docs/ROADMAP.md`: what's next, in order, and what's done. `/next` works from its top. Read it before proposing work.
- `docs/ARCHITECTURE.md`: how the app and its content are structured, and how to add a question, puzzle, line or division.
- `docs/DEVELOPMENT.md`: setup, scripts, the working agreement, and the full procedure for checking content.
- `docs/adr/`: why things are the way they are. Append-only.
- `e2e/`: one Playwright test that rides a line against the production build (`npm run e2e`, not part of `npm test`), and `readme.shots.ts`, which retakes the README's screenshots and GIF (`npm run screenshots`, needs ffmpeg).
- `probes/`: sandboxes that prove content against real React, NestJS and TypeScript. Not part of the app.
- `.claude/skills/next/`: the `/next` command. `.claude/skills/audit/`: the `/audit` command, an outsider's review at the end of each phase (`/audit quiz` to rehearse the interview questions). `.claude/agents/fact-checker.md`: the independent content reviewer.
- `.github/workflows/ci.yml`: CI on every push and pull request. It runs the format check, lint, typecheck, tests, the TypeScript probes, the build and the end-to-end test (see `docs/DEVELOPMENT.md`, "CI").

## How we work

- **Ryan owns it, Claude is the senior engineer.** Claude writes the code and content; Ryan makes the calls, reviews every commit, and pushes. Explaining the work in plain English is part of the deliverable.
- **Commit, never push.** Small Conventional Commits as the work goes (`feat:`, `fix:`, `content:`, `docs:`, `chore:`, `test:`, `refactor:`, and `style:` for a commit that only reformats). Subject says what, body says why. Content commits end with what they were checked against. Never push, never rewrite a pushed commit. No Claude co-author trailer: the README's How this was built section carries the disclosure instead ([ADR 0012](docs/adr/0012-disclose-ai-in-the-readme.md)).
- **Work on `main`.** Commit straight to `main` by default. Ryan decides when something gets its own branch and pull request, and says so; don't create one or draft a pull request unless he asks ([ADR 0017](docs/adr/0017-main-by-default.md)).
- **Stop for real decisions** with two or three options and a recommendation. Make routine choices and mention them.
- **Keep the docs true** in the same commit. A significant decision gets an ADR.
- **No loose threads.** A roadmap item is done when everything it touched is done, proven and documented. Anything found and not fixed goes on the roadmap.
- **The repo carries the context, not the chat.** Sessions get cleared between tasks. Anything a future session needs (a decision, a trap, a half-finished thread) goes in the docs or the roadmap before the session ends.

## Stack and commands

React 19, TypeScript (`strict`, 5.9), Vite 8, Vitest 5, Playwright 1.64 (Chromium only). No backend; progress lives in `localStorage`. Node 22.12+ for the app (Vitest needs it), 22.22.2+ or 24.15+ for the React probes. `.nvmrc` says 22.

- `npm run dev`: dev server at http://localhost:5173
- `npm test`: every test (run before every commit, with `lint` and `format:check`)
- `npm run lint`: ESLint, with the React hooks rules
- `npm run format`: Prettier on default settings (`format:check` only reports). Skips `probes/`.
- `npm run typecheck`: `tsc --noEmit`
- `npm run build`: typecheck and production build
- `npm run preview`: serve the production build
- `npm run bar`: where every line stands against the quality bar
- `npm run e2e`: build, then ride Repaint Line twice on Local in Chromium and move the save code to a fresh browser. Needs `npx playwright install chromium` once.
- `npm run screenshots`: build, then retake the README's images into `docs/`. Needs ffmpeg. Look at every image before committing.

## Code rules

- Game rules and scoring are pure functions with tests, in `src/algorithms/` or `src/engine/`. Components ask and render; they never decide what's correct.
- Don't break saves. A new save field needs a default in `emptySave()` and a check in `migrate()`. `migrate()` builds the save field by field, so a field it doesn't list is dropped on the next load ([ADR 0015](docs/adr/0015-repair-damaged-saves.md)).
- Use `useTimers()` (cleaned up on unmount) and `useKeys()` for keyboard shortcuts.
- Tiers: 1 Local, 2 Express, 3 Rush Hour. `api.assist` is false on Rush Hour; hide helper panels when it is.
- After tests pass, break the code once on purpose and confirm a test catches it.

## Content rules

Ryan is still learning this material, so he can't catch a wrong claim in review. The content has to be right before it's committed.

### Prove every claim

The docs are where a claim starts, not the proof. Reviews kept finding claims the docs seemed to support that the real code did not. So for every new or changed question, option, explanation, puzzle and field guide example:

1. Read the official docs for the version the app covers (react.dev, docs.nestjs.com, typescriptlang.org).
2. Prove it in `probes/`: TypeScript under 5.9, 6.0 and 7.0 with `strict`; React 19.3 rendered in jsdom (production too when StrictMode, warnings or timing matter); NestJS 12.1.3 on the Express adapter with supertest.
3. Prove the wrong options wrong. A distractor a knowledgeable person could defend is a bug.
4. Include one check that should fail, and confirm it does.
5. Re-prove after any edit, including rebalancing option lengths.
6. Before an inventory stop, the `fact-checker` agent reviews what changed. Verify each finding by re-running its probe before fixing, then a fresh fact-checker re-checks the fixes.

Full procedure: `docs/DEVELOPMENT.md`, "Checking content".

### Clarity comes first

The point of every line is that the idea clicks and can then be explained out loud in an interview. If a sentence needs reading twice, the sentence failed, not the reader. Ryan understands the concepts; dense wording is what slows him down. Every piece of copy (questions, options, explanations, field guides, puzzle notes, rehearsal answers) follows these:

1. **One idea per sentence.** Split anything held together by a colon or three commas.
2. **Example first, then the name.** Show `if (!user) return;`, then say "that is narrowing." Not the other way around.
3. **Define a term in plain words the first time it matters.** "Discriminant", "falsy", "metatype" and friends get a short definition or get replaced.
4. **Say what actually happens.** "The app crashes" beats "fails at runtime". "TypeScript forgets your check" beats "narrowing does not survive".
5. **Explain both sides.** A `why` says why the right answer is right and why the tempting wrong one is wrong.
6. **Clear, not long.** Cut any word that is not helping. No metaphors that need decoding.

NestJS, TypeScript and React are written to it. Algorithm lines are not yet.

### The rest

- Every question has its answer among its options (three parallel claims), and a `why` that teaches rather than restates.
- Tier 1 is what a junior should get. Tier 3 is the deep cut.
- Version-specific behavior says which version ("since React 19.2", "on the default Express adapter", "with `strict` on").
- No answer gives itself away by length. `data.test.ts` fails an answer 1.35x its distractors; the bar fails a line where the answer holds the same length position (longest, middle or shortest) on more than half its questions. Rewrite options as parallel claims; don't pad the wrong ones.
- The bar (`src/data/bar.ts`): 9 / 12 / 15 questions available on Local / Express / Rush Hour, two Local puzzles, three rehearsal prompts, talking points and a gotcha. Divisions in `FINISHED` fail the tests if a line slips.
- No two questions anywhere test the same fact with the same answer. Search before adding.
- `drill` is shown during play and must never contain the answer. `hook` is close to an answer key and only shows on the intro screen.
- Flows: check the order against a real run. Decoys must truly not happen in that scenario. Tier 1 flows must not all open the same way.
- Sort card names can't contain the first word of their own box, and can't contain backticks.

## Known traps

- **Quotes.** Run `npm run format` after editing; Prettier picks the quote that needs fewer escapes, so write `"don't"`, not `'don\'t'`. A script that writes `\\'` into a file still breaks it.
- **A reformatting commit** goes in `.git-blame-ignore-revs`. If it goes on a branch, merge that branch with a merge commit, never squashed or rebased, so the hash in that file survives.
- **An answer lives in two places**, `opts` and `a`. Change both.
- **Rewording a question resets its history.** A question's id is its line id plus a hash of its `q` and `code`, so moving it to another line resets it too.
- **Rebalancing option lengths can make a wrong option true.** Re-prove after every rewording.
- **jsdom details:** submit forms with `button.click()`; use jsdom's own `FormData` (the probes harness does). A Suspense boundary hides old content with `display: none` but leaves it in the DOM, so `textContent` still includes it.
- **React facts that look wrong in the docs:** an effect loop only warns, it isn't stopped. StrictMode runs setup, cleanup, setup but keeps state (not a real remount). Error boundaries catch errors in rendering, effects and Actions like a form action, but not in plain event handlers or timers. React never adds your `onClick` as a listener on the element (it listens once, on the createRoot container), but it does keep your function on the DOM node, and it sets the element's `onclick` to an empty function for Safari. So "React adds nothing to the button" is false.
- **NestJS facts that look wrong in the docs:** `@HttpCode()` still applies alongside `@Res()`. A missing `@Injectable()` can boot with an undefined dependency instead of failing.
- **Undo a planted bug by hand**, not with `git checkout -- <file>`, unless the real change is committed first. Checkout throws away every uncommitted edit in the file, not just the planted one.
- **Don't run `tsc -b`.** It leaves a `tsconfig.tsbuildinfo` in the repo. Use the npm scripts.
- **Don't kill processes by a pattern** (`pkill -f "vite preview"`) in a shell whose own command line matches it. Kill by PID or port.
- **The end-to-end test leans on Repaint Line.** It expects exactly one Local flow and one Local sort there, so two rides cover both puzzle kinds. It opens React's division header by its name, since a fresh save starts with only the first division open. It also clicks buttons by their labels ("Board: Local", "Back to the map", "Ride again", "Restore"), and checks the line's URL (`/react/render`) and Back and Forward mid-ride. Adding a Local puzzle to that line, or renaming those buttons, fails `npm run e2e` until the test is updated. `npm run screenshots` leans on the same line and buttons (plus "Map" on the results screen), and expects The Local to be the second algorithm line.
- **Colors go in `app.css`, not inline styles.** `src/styles/contrast.test.ts` checks every text color in the stylesheet against WCAG AA in light and dark, and fails on an inline `color:` or `background:` it cannot check. A new rule in a line's color (`var(--c)`) is checked against every line's color; if only one game uses it, list it in `LINE_RULES`. Vitest blanks CSS files, so `vite.config.ts` lets `app.css` through for that test.
- **The bundle is over 700 kB.** Vite's size warning on build is expected for now; splitting it is on the roadmap.

## Voice

- **In the app:** direct, a little funny, plain English, and clear before clever. The subway theme goes in names and headings, never in the teaching. **No em dashes** anywhere (a test enforces it in player-facing copy, and the rule holds for docs and commit messages too).
- **README:** professional, third person, no "I" or "we".
- **To Ryan:** plain English, short, no jargon without a definition. He would rather read one clear sentence than three clever ones.
