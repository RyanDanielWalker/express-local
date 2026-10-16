# Roadmap

Where this is going, what's parked, and what we learned building it. Not a contract. Delete anything that stops sounding like a good idea.

Status: 34 lines across 4 divisions, 97 tests, no backend. Four divisions is enough. The work now is making the three stack divisions good enough to carry an interview, in this order: **NestJS (done), then TypeScript (done), then React (done).** All three clear the bar, have been independently reviewed, and have their gaps closed.

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
- [x] **A clarity pass, line by line.** All nine lines rewritten to the clarity standard in CLAUDE.md: one idea per sentence, terms defined where they appear, and explanations that say why the tempting wrong answer is wrong. Three reviewers then ran all 201 changed fields against Nest 12.1.3 and flagged 19, all fixed.
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
- [x] **Independent review.** Three reviewers that had not seen the content checked about 360 claims with the compiler and current docs. Every marked answer held up, but they found 8 wrong items (two wrong options that were actually true, React.FC's history backwards, a Map claim, an Omit claim in a model answer) and about 20 misleading ones. All fixed, then a second pair re-checked every changed field: no wrong answers, and the remaining overstatements fixed too. The lesson is in CLAUDE.md: prove the wrong options, not just the right one.
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

## Next: the interface

NestJS, TypeScript and React all clear the bar, were independently reviewed against the compiler or running code, and have no open items. The interface work below is next, with the algorithm question pools still parked.

## Parked for now

- **Algorithms question pools.** Eleven lines, no question pools, so they contribute almost nothing to cram and their readiness has no recall component. Worth fixing, explicitly not now.
- **New divisions.** SQL and Postgres, GraphQL, Git as a train yard.
- **Engineer's Cab.** After Rush Hour, write the algorithm yourself against in-browser tests.
- **Scenario mode.** Read a real situation, pick the right tool. Still the best idea in this file, and it needs the content above to draw from.

## Interface

Orthogonal to the content work, and the thing to do when you want a break from writing questions.

- [ ] **Modes: deciding vs doing.** Boarding a line collapses the map, cram band and badges. The play screen gets the page.
- [ ] **A Today band.** What should I do right now: reviews due, shaky questions waiting, the daily ride, next unlocked line. Divisions below it collapsed, each with its readiness bar.
- [ ] **Badges become a count that opens a panel.**
- [ ] **Tabs on the intro screen.** Ride / Field guide / Say it out loud.
- [ ] **A router.** Back button currently dumps you out of the app mid-ride, and `/nest/life` should be a URL.
- [ ] **Split `App.tsx`.** Pull out `useRun` and `useDrills`.
- [ ] **CI on push**, and **deploy it**, so it is a live thing and not a repo.
- [ ] **Fresh screenshots** for the README, once the interface work above is done. The current ones predate the TypeScript and React puzzles and the clarity rewrite.
- [ ] **Upgrade the repo to TypeScript 6.** The app is built with 5.9 while its content teaches 6.0 behavior, like `strict` on by default. The content's probes already pass on 6.0 and 7.0, so this is about the build, not the lessons.
- [ ] **Split the bundle by division.** Every question ships in one chunk, now 723 kB (225 kB gzipped), past Vite's warning line. Loading each division's content lazily fixes it, but LINES is a synchronous array used everywhere, so it is a real refactor.

## Engine ideas

- [ ] **Interview mode.** Five random rehearsal prompts across divisions, timed, no retries. The closest thing to the real event.
- [ ] **Study plan.** Give it a date, get a daily plan that walks readiness up to where it needs to be by then.
- [ ] **"Stuck? Show me."** A voluntary hint that costs a heart on purpose and marks that step shaky.
- [ ] **Diminishing returns.** The fourth ride of the same line in one day should pay less. Needs a new save field.
- [ ] **Weekly report.** What decayed, what to drill, nothing else.

## The fork

Whether this gets a backend.

**For:** the roles being targeted are NestJS and Postgres, and "this is the tool I built to prepare for this interview, and here is the Nest API behind it" is a strong artifact. Cross-device sync would also mean phone and laptop share progress, which a save code does not really solve.

**Against:** it stops being a static file you can open anywhere, and it is a weekend rather than an afternoon.

**Call:** after the content bar is met. A thin app with a sync API is still a thin app.

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
