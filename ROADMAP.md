# Roadmap

Where this is going, what's parked, and what we learned building it. Not a contract. Delete anything that stops sounding like a good idea.

Status: 29 lines across 4 divisions, 74 tests, no backend. Four divisions is enough. The work now is making the three stack divisions good enough to carry an interview, in this order: **NestJS, then TypeScript, then React.** No new divisions until they clear the bar below.

## The bar

A line is **done** when:

1. It can fill a full run at every tier it offers: 6 questions on Local, 8 on Express, 10 on Rush Hour
2. It has at least three rehearsal prompts, written as a spoken answer
3. Its field guide has the talking points and the gotcha
4. It has at least one puzzle where order or judgment matters, not just recognition
5. It passes the content tests: answers not guessable by length, no em dashes, every option set clean

A division is **done** when every line clears that, and the division could carry an interview on its own topic. That second half is the one that adds lines rather than questions: NestJS without testing or auth is not a division that could carry a NestJS interview, however deep its other six lines get.

Nothing here is measured by vibes. An `npm run audit` that prints the bar per line is the first thing to build, so "is NestJS done" has an answer.

## Now: NestJS

- [ ] **Audit script.** Print every line against the five checks. Build it first so the rest of this is measurable.
- [ ] **Fill tier 1.** Nest lines carry 3 or 4 tier 1 questions against a run of 6, so about 13 new ones across the six lines.
- [ ] **Rehearsal to three prompts a line.** Currently two.
- [ ] **A "what do you actually type" line.** The whole division teaches concepts and never the API. The decorator you reach for, the interface you implement, the method you write, and real examples from the framework: `ValidationPipe`, `ParseIntPipe`, `AuthGuard`, `RolesGuard`, `ClassSerializerInterceptor`, `CacheInterceptor`, helmet and cors as middleware, `HttpExceptionFilter`. This is the gap behind "can you give me an example of a pipe".
- [ ] **A matching mechanic (`kind: 'sort'`).** Buckets across the top, real class and decorator names in a tray, put each one where it belongs. A wrong drop teaches what that thing actually is. Generalizes beyond Nest: React hooks by what they are for, TypeScript utilities by what they operate on.
- [ ] **A testing line.** `Test.createTestingModule`, `overrideProvider`, what to mock and what not to, testing a guard without standing up HTTP. More likely to come up in an interview than half of what the division already covers.
- [ ] **An auth line.** Guards plus strategies, JWT, where the user object comes from, why auth is a guard and not middleware.
- [ ] **More flows.** One flow line in the whole app is one too few. DI resolution and the validation pipeline both have an order worth drilling.

## Then: TypeScript

- [ ] Fill tier 1: about 18 questions across the six lines
- [ ] Rehearsal to three prompts a line
- [ ] A sort line: utility types by what they operate on, object keys vs union members
- [ ] A judgment puzzle per line, so it is not six recognition quizzes in a row

## Then: React

- [ ] Fill tier 1: about 19 questions across the six lines
- [ ] Rehearsal to three prompts a line
- [ ] A sort line: hooks by what they are for, and which ones are allowed where
- [ ] Likely missing lines: forms and controlled inputs, data fetching and error boundaries

## Parked until those are done

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

- **Measure, don't eyeball.** The correct answer was the longest option in 83% of questions before anyone counted. A test enforces it now.
- **A hint panel must never contain the answer.** The lifecycle hook was printed twice on screen while you solved the lifecycle puzzle.
- **Color means one thing everywhere.** Red is wrong, green is right, the line color is identity.
- **The headline number should be a state you can lose, not a total you accumulate.** XP measures time spent. Readiness measures what you would recall today.
- **Pay for the weak stuff.** If replaying a mastered line is the best XP on the board, the scoring is teaching the wrong habit.
- **Content is data.** Lines live in `src/data/`, validated by tests, so adding a topic is writing questions and not writing components.
- **Never answer the question for them.** Feedback on a miss should say that it was a miss, not what the answer was.
- **Recognition is not recall, and recall is not speech.** Hence shaky drills and out-loud rehearsal. The interview tests the third one.
- **Concepts without the API is half a lesson.** Knowing a pipe validates input and not being able to name `ValidationPipe` is the gap between having read the docs and having used the thing.
- **Depth before breadth.** A division that cannot carry an interview on its own topic is not finished, and a new division does not fix it.
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
