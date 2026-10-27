# Roadmap

What 1.0 means, what's next in order, then what's done, what's parked, and what we learned building it. `/next` works from the top of **Next, in order**. Not a contract: delete anything that stops sounding like a good idea, and record why in an ADR if it was a real decision.

## 1.0

Express & Local 1.0 is done when a visitor or reviewer can check each of these ([ADR 0010](adr/0010-a-portfolio-piece-with-a-1-0.md)):

1. It is live at a public URL, deployed from `main`, and a deploy waits for a green CI check.
2. CI runs the format check, lint, typecheck, every test (the bar included), the TypeScript probes and a build on every push.
3. The README opens with a fresh GIF, has a small architecture diagram, a **How this was built** section, and a license.
4. NestJS, TypeScript and React have no near-duplicate questions.
5. The interface a visitor notices first: play mode takes the screen, a Today band says what to do now, and a router makes Back work and gives every line a URL.
6. A pasted save code is validated before it is trusted, and one end-to-end test rides a line against the production build.
7. Ryan passed an `/audit quiz`, wrote the case study in his own words, and tagged `v1.0`.

**Frozen.** New findings go to Parked unless they are a security hole, a bug a visitor would hit, or embarrassing on the first screen. The backend is 2.0, not 1.0.

Status: 34 lines across 4 divisions, 110 tests plus one end-to-end test, no backend, not deployed. NestJS, TypeScript and React all clear the bar, were independently reviewed against the compiler or running code, and have their gaps closed. Algorithms are parked. Last inventory stop: 2026-10-27, after the near-duplicate work (find it with `git log --grep '^docs: inventory stop'`).

## Next, in order

Depth first ([ADR 0002](adr/0002-depth-first.md)): finish one thing completely, with no loose threads, before starting the next. An inventory stop closes each block of work.

### 1. Foundation

The checks go in before more features, so every later change is checked the same way. The deploy waits until the end ([ADR 0014](adr/0014-deploy-last.md)).

- [x] **Prettier and ESLint.** Defaults, applied in one formatting commit listed in `.git-blame-ignore-revs` so `git blame` skips it. Prettier picks whichever quote needs fewer escapes, which retires the escaped-apostrophe trap in the data files.
- [x] **CI on every push and pull request.** `.github/workflows/ci.yml` runs the format check, lint, typecheck, `npm test`, the TypeScript probes and the build, then `npm audit --omit=dev` without blocking ([ADR 0013](adr/0013-ci-on-github-actions.md)). `npm audit fix` cleared the four dev-tooling advisories first (Vite 8.3.5, Vitest 5.0.5, source-map-js 1.2.2).
- [x] **Validate pasted save codes.** `migrate()` checks every field by hand and repairs what it can: a wrong type gets its default, an unreadable entry is dropped, unknown keys are left out ([ADR 0015](adr/0015-repair-damaged-saves.md)). Built in normal mode at Ryan's call, so the `/next learn` piece for 1.0 moves to the Today band.
- [x] **One end-to-end test.** `e2e/ride.spec.ts` rides Repaint Line twice on Local in Chromium against the production build, solving a flow on one ride and a sort on the other, then moves the save code into a fresh browser. It runs in CI after the build, at Ryan's call ([ADR 0016](adr/0016-end-to-end-test-in-ci.md)).

### 2. Near-duplicate questions

A cross-line review found pairs of questions that test the same fact with the same answer. A pair inside one line is the worse kind, because one run can show both, so the second is free. For each pair, keep the question in the line that owns the topic and give the other a new angle: a different fact the line should teach, written to the clarity standard, proven like any new question, with option lengths rebalanced. Same-line pairs first.

Same line:

- [x] **Memo Yard:** "A table renders 10,000 rows and scrolling stutters. What actually fixes it?" (t3) vs "What does virtualization do for a long list?" (t1). Nearly the same answer text.
- [x] **Memo Yard:** "How do you find out what is actually slow?" (t3) vs "What should you do before adding memo anywhere?" (t1). Both answer "measure with the Profiler first".
- [x] **Repaint Line:** "A parent re-renders. Its child gets exactly the same props..." (t1) vs "A parent's state changes. Its child takes no props at all..." (t1).
- [x] **Generic Line:** "Why use a generic instead of any?" (t1) vs "Which signature keeps the type of what you pass in?" (t1).
- [x] **Dispatch Desk:** "Send your own JSON shape whenever a NotFoundException is thrown." (t1) vs "Turn every thrown error into your standard error JSON shape, and log it." (t1).
- [x] **Test Track:** "Unit testing OrdersService, which injects PaymentsService. What goes in providers?" (t1) vs "OrdersService calls PaymentsService, which calls Stripe... What do you fake?" (t1).
- [x] **Platform Signs (weaker):** the two route-order questions, "GET /users/me. Which handler runs?" (t1) and "A catch-all route is declared first..." (t3). Also the two status-code questions: "How do you make a handler send 204...?" (t1) and "What status does this return on success?" (t2). Keep both of a pair only if they really test different things.

Across lines (each line should own its topic):

- [x] "What does wrapping a component in memo do?" (Repaint Line, t1) vs "What does React.memo do?" (Memo Yard, t1). They share a distractor too.
- [x] "What does the React Compiler do?" (Repaint Line, t3) vs "Your team turns on the React Compiler..." (Memo Yard, t3).
- [x] The memoized child with `style={{ margin: 8 }}` (Repaint Line, t2) vs the memoized child with an inline arrow (Memo Yard, t2, "Why does this memoized child still re-render...").
- [x] "What is wrong with this?" (Side Track, t2: a full name computed in an effect) vs "You store filteredItems in state and update it in an effect..." (Snapshot Line, t3). Both answer "compute it during render".
- [x] "Two components both call useCounter()..." (Hook Junction, t2) vs "useWindowWidth()... How many listeners?" (Hook Junction, t1).
- [x] "What is new in React 19 for passing a ref into a function component?" (Hook Junction, t2) vs "React 19. How does a function component accept a ref?" (Typed Components, t2).
- [x] "`(pet as Cat).meow()`... What does the `as` do when the code runs?" (Narrow Gauge, t1) vs "What does `as User` actually do?" (Unknown Territory, t1).
- [x] "Why put this `never` line in the default of a switch?" (Narrow Gauge, t2) vs "What is `never` good for?" (Unknown Territory, t2).
- [x] "How do you type a React component that takes a list of anything?" (Generic Line, t3) vs "What does making this component generic give you?" (Typed Components, t3).
- [x] "Data should only exist once status is done..." (Shape Yard, t3) vs "A prop should be required only when another prop is set. How?" (Typed Components, t3).
- [x] "When do you use 401 versus 403?" (Fault Line, t2) vs "What is the difference between authentication and authorization?" (Turnstile, t1).
- [x] "A global auth guard is on, but /health has to stay public." (Dispatch Desk, t2) vs "A global auth guard is on. How does /health stay reachable?" (Turnstile, t1).
- [x] "Why register a global guard with APP_GUARD instead of app.useGlobalGuards()?" (Tool Shed, t2) vs "Your global exception filter injects a LoggerService..." (Fault Line, t2). Same `APP_*` provider idea; keep only if the angles differ.

Smaller cleanups from the same review:

- [x] "forwardRef" means React's ref forwarding on Hook Junction and Typed Components, but Nest's circular-dependency helper on Wiring Yard. Say "Nest's `forwardRef` (from `@nestjs/common`, unrelated to React's)" once on Wiring Yard. Its rehearse answer also recommends `forwardRef` twice.
- [x] Main Line's flow note calls a middleware rate limiter "fine for a rate limit", while Dispatch Desk teaches `ThrottlerGuard`. Add a clause on when a guard is the better home (routes that opt out with `@SkipThrottle()`), proven in `probes/nest`.
- [x] The `@nestjs/throttler` claims on Dispatch Desk (`ThrottlerGuard`, `@SkipThrottle()`, in a sort card and a question's `why`) were checked against the docs but never run: the package was not in the sandbox. It is pinned in `probes/nest` now. Prove them, and fix anything the run contradicts.

### 3. Inventory stop

- [x] A fact-check pass by a separate agent that did not write the changes (the `fact-checker` agent), over every question touched in step 2. Verify each finding by re-running its probe before fixing, then a fresh agent re-checks the fixes.
- [x] Sanity pass: `npm test`, `npm run bar`, `npm run build`, the probes pass (see [DEVELOPMENT.md](DEVELOPMENT.md#inventory-stops), step 2), play each changed line end to end in a browser, and every doc still true.

### 4. Interface

What a visitor notices first. In this order:

- [x] **Modes: deciding vs doing.** Boarding a line collapses the map, cram band and badges. The play screen gets the page.
- [ ] **A Today band.** What should I do right now: reviews due, shaky questions waiting, the daily ride, next unlocked line. Divisions below it collapsed, each with its readiness bar. Picking what to do now is a pure function in `src/engine/` with tests. Built in normal mode: the learn-mode piece moved to after 1.0 ([ADR 0018](adr/0018-learn-mode-after-1-0.md)).
- [ ] **A router.** Back button currently dumps you out of the app mid-ride, and `/nest/life` should be a URL.
- [ ] **Accessibility checks as tests.** A test that fails when an input has no label or an icon-only button has no name, a contrast test against the color variables in `app.css` in light and dark, and a check at 375px wide (the smallest breakpoint today is 480px).
- [ ] **README refresh.** A fresh GIF and screenshots (the current ones predate the TypeScript and React puzzles and the clarity rewrite), and a small architecture diagram.

### 5. Inventory stop

- [ ] Sanity pass after the interface work: everything in step 3's sanity pass, plus the app on a phone-width screen in light and dark, and keyboard-only play.
- [ ] `/audit`, and its findings sorted into 1.0 (only if they meet the freeze rule) or Parked.

### 6. Ship 1.0

- [ ] **Deploy** the static build from `main`, with security headers ([ADR 0014](adr/0014-deploy-last.md)). Fix `index.html`'s meta description first: it still calls this a game for learning algorithms, and it is what a shared link shows. Decide first whether the repo goes public. A public repo lets a visitor read the code, and lets GitHub block a deploy until CI passes (branch protection on a private repo needs a paid plan). A private repo can still deploy: the CI workflow runs the deploy as its last step, only after every check passes.
- [ ] `/audit quiz`: Ryan answers the likely interview questions about the app, one at a time.
- [ ] **The case study**, `docs/CASE-STUDY.md`, written by Ryan in his own words: what was built, what broke, what was decided and why, and how he worked with Claude. Claude can review it, not write it.
- [ ] Tag `v1.0`, then decide what's next from **Parked**, and record the decision in an ADR.

## The bar

A line is **done** when:

1. It can fill a full run at every tier it offers: 6 questions on Local, 8 on Express, 10 on Rush Hour
2. Replays differ: every tier's pool is at least 1.5x a run, and a quiz line has two puzzles on Local, so the second ride is not a memory test of the first
3. It has at least three rehearsal prompts, written as a spoken answer
4. Its field guide has the talking points and the gotcha
5. It has at least one puzzle where order or judgment matters, not just recognition
6. It passes the content tests: answers not guessable by length, no em dashes, every option set clean

A division is **done** when every line clears that, and the division could carry an interview on its own topic. That second half is the one that adds lines rather than questions: NestJS without testing or auth is not a division that could carry a NestJS interview, however deep its other six lines get.

Nothing here is measured by vibes. `src/data/bar.ts` encodes checks 1 to 5 and the length part of 6 (data tests cover the rest of 6), `npm run bar` prints where every line stands, and any division listed in `FINISHED` is enforced by the test suite from then on, so finished stays finished.

Algorithms shows 0 of 11 in `npm run bar` because the game lines have no rehearsal prompts or talking points yet. That is expected while the division is parked, not a regression.

## Done: NestJS

Nine lines, all clearing the bar, listed in `FINISHED` so the suite fails if any slips. The one Nest-adjacent gap is data access (repositories, transactions in a service), which belongs with the SQL and Postgres division when that is unparked.

- [x] **The bar, as a test ratchet.** First run: NestJS 1 of 6 lines clear. Now 9 of 9.
- [x] **Mixed runs.** Every quiz line in the app fails the judgment check, because a quiz line can only hold questions. Let a quiz line carry a flow or a sort that plays inside its run, so the DTO line can end on "order the validation pipeline" instead of a ninth recognition question. This is engine work, and it is what makes check 4 reachable at all.
- [x] **Fill tier 1.** Thirteen new questions, leaning toward what you type: `@Param` versus `@Query`, `useGlobalPipes`, throwing versus returning a 404.
- [x] **Rehearsal to three prompts a line.** Including "give me a real example of each building block."
- [x] **A "what do you actually type" line.** Tool Shed: the interfaces and method signatures behind each building block, `canActivate`, `transform`, `intercept`, `catch`, `use`.
- [x] **A matching mechanic.** Shipped as sorts that a quiz line ends on, rather than a line kind of their own. Cards are named by the job, never by their box, and a test enforces it. Generalizes beyond Nest: React hooks by what they are for, TypeScript utilities by what they operate on.
- [x] **A testing line.** Test Track. `Test.createTestingModule`, `overrideProvider`, what to mock and what not to, testing a guard without standing up HTTP. More likely to come up in an interview than half of what the division already covers.
- [x] **An auth line.** Turnstile. Guards plus strategies, JWT, where the user object comes from, why auth is a guard and not middleware.
- [x] **More flows.** The validation pipeline on the DTO line, DI resolution order on Wiring Yard, an exception's trip to the client on Fault Line, and an interceptor wrapping a handler on Tool Shed.
- [x] **A clarity pass, line by line.** All nine lines rewritten to the clarity standard in [CLAUDE.md](../CLAUDE.md): one idea per sentence, terms defined where they appear, and explanations that say why the tempting wrong answer is wrong. Three reviewers then ran all 201 changed fields against Nest 12.1.3 and flagged 19, all fixed.
- [x] **Replays that differ.** Every Local ride on Wiring Yard was identical: pools were exactly the size of a run, with one puzzle. Now 9 Local questions and 2 Local puzzles per line, unseen and shaky questions first, puzzles rotating ride by ride.
- [x] **Independent review.** Three reviewers that had not seen the content ran its claims as real code against Nest 12.1.3. They found wrong answers or explanations on most lines, and many more misleading ones. The worst: a missing `@Injectable()` listed as a cause of "can't resolve dependencies" (it boots, with an undefined dependency), `overrideGuard` advised for a global `APP_GUARD` it cannot reach, `transform: true` said to convert DTO fields, and a catch-all filter example that dropped every error message. Each finding was checked against the Nest source or a probe, fixed line by line, then a second set of reviewers re-checked all 122 changed fields and flagged 16 more, also fixed.
- [x] **Gaps the reviewers flagged.** 13 new questions: dynamic modules (`forRoot`, `forFeature`, `forRootAsync`) and lifecycle and shutdown hooks on Wiring Yard, an `APP_FILTER` filter with dependencies on Fault Line, custom decorators (`Reflector.createDecorator`, `applyDecorators`, `createParamDecorator`) on Tool Shed, GraphQL guards and token storage on Turnstile, and global pipes in e2e tests on Test Track. Each was run against Nest 12.1.3, then checked by an independent reviewer.

## Done: TypeScript

All six lines clear the bar, listed in `FINISHED` so the suite enforces it. Every claim on every line was written as code and proved with `tsc`, with each probe shown to fail first. The probes pass under TypeScript 5.9 (what the repo builds with), 6.0 and 7.0 (`strict` on by default since 6.0; 7.0 is the same checker ported to Go), against `@types/react` 19.3.

- [x] **Narrow Gauge:** narrowing checks, the else branch, the truthiness trap, type predicates (including 5.5 inferred ones on filter), and two sorts
- [x] **Generic Line:** everyday generics (Promise, Array, Set), inferred vs written type arguments, constraints, and a sort on which calls compile
- [x] **Utility Yard:** Partial, Pick, Omit, Record, Readonly, the Pick vs Omit typo trap, and the object-keys vs union-members sort
- [x] **Unknown Territory:** any vs unknown, how any spreads, as and ! as claims not checks, satisfies (fixed: it does not keep literals, it keeps exact keys)
- [x] **Shape Yard:** structural typing, the excess property check, declaration merging, extends vs &, branded types
- [x] **Typed Components:** props, children, events, refs and hook type arguments on React 19 types. Found along the way: the global JSX namespace is gone, FormEvent is deprecated in favor of SubmitEvent, and ref is a normal prop
- [x] **Independent review.** Three reviewers that had not seen the content checked about 360 claims with the compiler and current docs. Every marked answer held up, but they found 8 wrong items (two wrong options that were actually true, React.FC's history backwards, a Map claim, an Omit claim in a model answer) and about 20 misleading ones. All fixed, then a second pair re-checked every changed field: no wrong answers, and the remaining overstatements fixed too. The lesson is in [CLAUDE.md](../CLAUDE.md): prove the wrong options, not just the right one.
- [x] **Gaps the reviewers flagged.** 8 new questions: assertion functions and `x == null` on Narrow Gauge, generic type aliases and defaults on Generic Line, Omit on a union on Utility Yard, `.catch()` callbacks on Unknown Territory, and context and `ComponentProps<'button'>` on Typed Components. Each was proved with `tsc`, then checked by an independent reviewer.

## Done: React

All eight lines clear the bar, listed in `FINISHED` so the suite enforces it. Every claim was run in a React 19.3 sandbox: real components rendered with `react-dom` in jsdom, with renders counted, effects logged and DOM changes watched, in development and production builds.

- [x] **Fill tier 1.** 37 new Local questions, so every line has 9, plus a few deeper ones.
- [x] **Two Local puzzles a line.** A sort and a flow on each: what makes Counter render again, effect versus render versus handler, where a value should live, good and risky keys, which memo tool fits, which hook calls break the rules. The flows walk through a click, a changing roomId, a mixed setState queue, deleting from an index-keyed list, an inline arrow defeating memo, and a conditional hook.
- [x] **Rehearsal to three prompts a line**, and a drill for every side panel.
- [x] **No more length giveaways.** Memo Yard had the answer as the longest option on 8 of 9 questions. Every line now spreads it across longest, middle and shortest.
- [x] **The clarity standard**, on every explanation, field guide and note.
- [x] **Independent review.** Three reviewers ran all 325 items against React 19.3 and flagged 55. The worst: an effect loop React was said to stop (it only warns, and the loop runs on), StrictMode described as a real remount, state updates said to apply before the next render instead of during it, and a conditional-hook question whose code never actually threw. All fixed, then a fresh reviewer re-checked the 75 changed fields and flagged 14 more, also fixed.
- [x] **Gaps the reviewers flagged.** Two new lines: Fare Machine, on controlled and uncontrolled inputs and React 19 form Actions, and Arrivals Board, on Suspense, `use()`, error boundaries and request waterfalls. Side Track gained three questions on the React 19.2 additions, `useEffectEvent` and `<Activity>`. Three fresh reviewers ran the new content against React 19.3 and flagged 14 items. The biggest: error boundaries were said to catch only rendering errors, but they also catch errors in effects and in Actions, like a form action. All fixed, then a fresh reviewer re-checked the changed fields and flagged 5 wording points, also fixed.

## Parked for now

- **A piece of core code written by Ryan with `/next learn`.** Moved out of 1.0 at Ryan's call ([ADR 0018](adr/0018-learn-mode-after-1-0.md)). First in line once `v1.0` is tagged.
- **Algorithms question pools.** Eleven lines, no question pools, so they contribute almost nothing to cram and their readiness has no recall component. Worth fixing, explicitly not now.
- **New divisions.** SQL and Postgres, GraphQL, Git as a train yard.
- **Engineer's Cab.** After Rush Hour, write the algorithm yourself against in-browser tests.
- **Scenario mode.** Read a real situation, pick the right tool. Still the best idea in this file, and it needs the content above to draw from.
- **Interface extras.** Badges become a count that opens a panel. Tabs on the intro screen (Ride / Field guide / Say it out loud). Split `App.tsx` into `useRun` and `useDrills` (pick this up with the router if `App.tsx` gets in the way).
- **Upgrade the build to TypeScript 6.** The app builds with 5.9 while its content teaches 6.0 behavior, like `strict` on by default. The probes already pass on 6.0 and 7.0, so this is about the build, not the lessons.
- **Dependabot for the workflow and npm.** The CI actions are pinned to commit hashes, which never update themselves ([ADR 0013](adr/0013-ci-on-github-actions.md)). Dependabot would open a pull request for each new release. Bumping by hand is fine while there are two actions.
- **Keep the trace from a red end-to-end run in CI.** Playwright saves a trace (a step-by-step recording) when the test fails, but CI throws it away with the machine. Uploading it as a workflow artifact would show what the page looked like at the failure. Until then, reproduce a red run with `npm run e2e`, which keeps the trace in `test-results/`.
- **Split the bundle by division.** Every question ships in one chunk, over 700 kB (about 225 kB gzipped). `LINES` is a synchronous array used everywhere, so it is a real refactor.

## Later: engine ideas

- [ ] **Interview mode.** Five random rehearsal prompts across divisions, timed, no retries. The closest thing to the real event.
- [ ] **Study plan.** Give it a date, get a daily plan that walks readiness up to where it needs to be by then.
- [ ] **"Stuck? Show me."** A voluntary hint that costs a heart on purpose and marks that step shaky.
- [ ] **Diminishing returns.** The fourth ride of the same line in one day should pay less. Needs a new save field.
- [ ] **Weekly report.** What decayed, what to drill, nothing else.

## 2.0: a backend

A NestJS and Postgres sync API, so phone and laptop share progress and the app shows the stack it drills. Decided against for 1.0 in [ADR 0010](adr/0010-a-portfolio-piece-with-a-1-0.md). If it happens, the backend half of the Snippr playbook is its plan.

## Principles

Learned the hard way, mostly by getting them wrong first.

- **Measure, don't eyeball.** The correct answer was the longest option in 83% of questions before anyone counted. A test enforces it now. Then the fix for that, padding the wrong answers, quietly made the middle-length option right more than half the time on four lines. The bar now checks every length position, not just the one we thought of first.
- **A hint panel must never contain the answer.** The lifecycle hook was printed twice on screen while you solved the lifecycle puzzle.
- **Color means one thing everywhere.** Red is wrong, green is right, the line color is identity.
- **The headline number should be a state you can lose, not a total you accumulate.** XP measures time spent. Readiness measures what you would recall today.
- **Pay for the weak stuff.** If replaying a mastered line is the best XP on the board, the scoring is teaching the wrong habit.
- **Content is data.** Lines live in `src/data/`, validated by tests, so adding a topic is writing questions and not writing components.
- **Never answer the question for them.** Feedback on a miss should say that it was a miss, not what the answer was.
- **A replay should teach something.** If the second ride is the first ride again, it tests memory of the ride, not the material. Size pools well past a run and lead with what has not been seen.
- **Recognition is not recall, and recall is not speech.** Hence shaky drills and out-loud rehearsal. The interview tests the third one.
- **Concepts without the API is half a lesson.** Knowing a pipe validates input and not being able to name `ValidationPipe` is the gap between having read the docs and having used the thing.
- **Depth before breadth.** A division that cannot carry an interview on its own topic is not finished, and a new division does not fix it.
- **Prove it with the compiler.** Rereading TypeScript content missed two wrong claims that `tsc` caught in seconds: a wrong answer that actually worked, and an explanation that predated 5.5. Every claim gets written as code with an assertion, and the probe gets a deliberate wrong assertion first, to prove it can fail.
- **Check the docs, then run it.** NestJS 12 shipped after the first Nest lines were written. A pass against the current docs found rules stated as universal that were really Express defaults or ValidationPipe specifics. Running the claims as real code found more, including spots where the docs and the code disagree. Say which version or adapter a claim depends on, run it, and re-check a division when its framework ships a major version.
- **Clear beats clever.** If a sentence needs reading twice, it failed. One idea per sentence, the example before the name for it, and every term defined the first time it matters. Taking longer to write it clearly is fine: this is a months-long project, and the goal is being able to say it in an interview.
- **No em dashes.**

## Shipped

- **2026-09-21** Ported out of a chat artifact into a Vite + React 19 + TypeScript repo
- **2026-10-06** Quiz and flow line kinds, divisions, and the map split by division
- **2026-10-06** NestJS division, six lines
- **2026-10-06** React division, six lines and 60 questions
- **2026-10-06** Cram drill, mixed across divisions, filterable
- **2026-10-06** Option lengths stopped giving the answer away (109 option sets rewritten)
- **2026-10-06** Per-question tracking, shaky drills, miss recaps on both ending screens
- **2026-10-06** Out-loud rehearsal, 26 prompts, shaky ones asked first next time
- **2026-10-06** TypeScript division, six lines, 60 questions
- **2026-10-06** Flow puzzles stopped showing their own answer, and stopped using red for correct
- **2026-10-06** Flow puzzles got mid-flight starts, decoy steps, and openings that differ
- **2026-10-06** Readiness replaced XP as the headline, ranks re-pegged, derailing costs XP
- **2026-10-06** Flow misses stopped naming the answer, with hints that fade by tier
- **2026-10-06** Drills advance on a click, not a timer, with keyboard shortcuts and a clock that holds while you read
- **2026-10-07** Roadmap restructured around a done bar, depth before breadth
- **2026-10-07** The bar as a test ratchet, `npm run bar`
- **2026-10-07** Sort puzzles, and quiz runs that end on a puzzle as their last stop
- **2026-10-07** Answer keys taken off the play screen: quiz side panels use a drill, the guide panel only shows on algorithm games
- **2026-10-07** NestJS clears the bar on all six lines: full runs at every tier, three rehearsal prompts, a puzzle each
- **2026-10-07** Daily Ride pinned by line id, so lines can be added anywhere
- **2026-10-07** The bar checks each line for answers that give themselves away by length
- **2026-10-07** Tool Shed, Turnstile and Test Track. NestJS finished: nine lines, enforced by the suite
- **2026-10-07** NestJS content checked against the v12 docs: route order, schema-first validation, errorCode, serialization, Jest on Node 24.9
- **2026-10-07** Replays differ: unseen and shaky questions first, puzzles rotate, and the bar checks pool size. 24 new Local questions and 9 Local puzzles across NestJS
- **2026-10-13** Narrow Gauge clears the bar, the first TypeScript line to do it
- **2026-10-15** Clarity standard for all copy; Narrow Gauge rewritten to it
- **2026-10-15** Generic Line clears the bar, every claim checked with tsc
- **2026-10-15** The bar checks for any length giveaway (longest, middle or shortest), not just the longest. Tool Shed and Test Track rebalanced
- **2026-10-15** Utility Yard clears the bar. TypeScript at 3 of 6
- **2026-10-15** Unknown Territory, Shape Yard and Typed Components clear the bar. TypeScript at 6 of 6, pending independent review
- **2026-10-15** Independent review of TypeScript: 8 wrong and about 20 misleading items found and fixed, re-checked, and TypeScript added to `FINISHED`
- **2026-10-15** Independent review of NestJS against running Nest 12.1.3 code: wrong and misleading items fixed across all nine lines, then re-checked
- **2026-10-15** NestJS clarity pass: all nine lines rewritten to the clarity standard, then reviewed against running code
- **2026-10-15** NestJS gaps closed: 13 questions on dynamic modules, lifecycle hooks, custom decorators, GraphQL guards, token storage and e2e pipes
- **2026-10-15** TypeScript gaps closed: 8 questions, each proved with tsc. NestJS and TypeScript have no open items
- **2026-10-16** Flow puzzles say where a missed step goes and what you tried instead
- **2026-10-16** React clears the bar on all six lines: 37 new Local questions, 12 puzzles, the clarity standard, every claim run against React 19.3
- **2026-10-16** Independent review of React: 55 items fixed, re-checked, and React added to `FINISHED`
- **2026-10-16** React gaps closed: Fare Machine (forms and Actions), Arrivals Board (Suspense and error boundaries), and `useEffectEvent` and `<Activity>` on Side Track. React has no open items
- **2026-10-16** Consistency pass across all 34 lines: older React answers updated for `<Activity>`, Actions and `useEffectEvent`, two React questions that repeated others replaced, stale comments and docs fixed, and the new lines played end to end in a browser
- **2026-10-17** Moved to a terminal workflow: `CLAUDE.md` rewritten for Claude Code, `docs/` (this roadmap, architecture, development, decision records), the `/next` command, a `fact-checker` agent, the fact-check sandboxes committed under `probes/`, and a test that keeps question ids unique within a line
- **2026-10-26** Prettier and ESLint: the repo formatted in one commit that `git blame` skips, and all 18 lint findings fixed, among them state changed in place in the stack and queue game and the clock read during render
- **2026-10-26** CI on GitHub Actions for every push and pull request, and the dev-tooling audit advisories cleared
- **2026-10-26** Damaged save codes repaired field by field instead of trusted, so a bad field can't wipe progress or crash a ride
- **2026-10-26** One end-to-end test: a Playwright ride through the production build, run in CI
- **2026-10-27** The seven same-line near-duplicate pairs: eight questions replaced with new angles on Repaint Line, Memo Yard, Generic Line, Dispatch Desk, Test Track and Platform Signs, each proven in `probes/` and fact-checked
- **2026-10-27** Ten of the thirteen cross-line near-duplicate pairs: five React questions and five TypeScript questions replaced with new angles, so Memo Yard keeps memo and the compiler, Unknown Territory keeps `as`, Narrow Gauge keeps exhaustive `never`, and Shape Yard keeps unions of valid shapes
- **2026-10-27** The last three cross-line near-duplicate pairs, all NestJS: Turnstile keeps authentication versus authorization and the @Public() route, Fault Line keeps APP_FILTER, and Fault Line, Dispatch Desk and Tool Shed get new questions on an un-awaited rejection crashing the server, a guard's 403 reaching the exception filter but never an interceptor, and an `APP_GUARD` covering every route
- **2026-10-27** The three smaller cleanups from the near-duplicate review: Wiring Yard says its `forwardRef` is Nest's, not React's, Main Line's middleware rate limiter says when `ThrottlerGuard` is the better home, and the `@nestjs/throttler` claims on Dispatch Desk were run against the real package. They held up, but one question's `why` leaned on `@SkipThrottle()`, which an interceptor can read too, so that reason was dropped. The fact-checker also tightened Wiring Yard's missing `@Injectable()` sentence: Nest starts fine, and the first request that uses the dependency fails with a 500
- **2026-10-27** Inventory stop after the near-duplicate work. Three fact-checkers ran every changed field since the last stop against TypeScript 5.9 to 7.0, React 19.3 and Nest 12.1.3. They found one overstated sentence: a `why` said React never attaches your click handler to the button, when it does keep it on the node, just never as a listener. Fixed, proven in `probes/react/render3.tsx`, and re-checked. All 23 stack quiz and flow lines were ridden twice on Local against the production build with no console errors
- **2026-10-27** Deciding vs doing: a ride, drill or rehearsal hides the map, badges and save box, shrinks the header to a **Back to the map** button, and starts at the top of the screen
