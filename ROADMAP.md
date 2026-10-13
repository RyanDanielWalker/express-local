# Roadmap

Where this is going, what's parked, and what we learned building it. Not a contract. Delete anything that stops sounding like a good idea.

Status: 32 lines across 4 divisions, 92 tests, no backend. Four divisions is enough. The work now is making the three stack divisions good enough to carry an interview, in this order: **NestJS (done), then TypeScript, then React.** No new divisions until they clear the bar below.

## The bar

A line is **done** when:

1. It can fill a full run at every tier it offers: 6 questions on Local, 8 on Express, 10 on Rush Hour
2. Replays differ: every tier's pool is at least 1.5x a run, and a quiz line has two puzzles on Local, so the second ride is not a memory test of the first
3. It has at least three rehearsal prompts, written as a spoken answer
4. Its field guide has the talking points and the gotcha
5. It has at least one puzzle where order or judgment matters, not just recognition
6. It passes the content tests: answers not guessable by length, no em dashes, every option set clean

A division is **done** when every line clears that, and the division could carry an interview on its own topic. That second half is the one that adds lines rather than questions: NestJS without testing or auth is not a division that could carry a NestJS interview, however deep its other six lines get.

Nothing here is measured by vibes. `src/data/bar.ts` encodes checks 1 to 5 (data tests already cover 6), `npm run bar` prints where every line stands, and any division listed in `FINISHED` is enforced by the test suite from then on, so finished stays finished.

## Done: NestJS

Nine lines, all clearing the bar, listed in `FINISHED` so the suite fails if any slips. The one Nest-adjacent gap is data access (repositories, transactions in a service), which belongs with the SQL and Postgres division when that is unparked.

- [x] **The bar, as a test ratchet.** First run: NestJS 1 of 6 lines clear. Now 6 of 6.
- [x] **Mixed runs.** Every quiz line in the app fails the judgment check, because a quiz line can only hold questions. Let a quiz line carry a flow or a sort that plays inside its run, so the DTO line can end on "order the validation pipeline" instead of a ninth recognition question. This is engine work, and it is what makes check 4 reachable at all.
- [x] **Fill tier 1.** Thirteen new questions, leaning toward what you type: `@Param` versus `@Query`, `useGlobalPipes`, throwing versus returning a 404.
- [x] **Rehearsal to three prompts a line.** Including "give me a real example of each building block."
- [x] **A "what do you actually type" line.** Tool Shed. Partly covered now by the new tier 1 questions and the real-packages sort. Still worth a line of its own for interfaces and method signatures: `canActivate`, `transform`, `intercept`, `catch`, `use`.
- [x] **A matching mechanic.** Shipped as sorts that a quiz line ends on, rather than a line kind of their own. Cards are named by the job, never by their box, and a test enforces it. Generalizes beyond Nest: React hooks by what they are for, TypeScript utilities by what they operate on.
- [x] **A testing line.** Test Track. `Test.createTestingModule`, `overrideProvider`, what to mock and what not to, testing a guard without standing up HTTP. More likely to come up in an interview than half of what the division already covers.
- [x] **An auth line.** Turnstile. Guards plus strategies, JWT, where the user object comes from, why auth is a guard and not middleware.
- [x] **More flows.** The validation pipeline on the DTO line, DI resolution order on Wiring Yard, an exception's trip to the client on Fault Line, and an interceptor wrapping a handler on Tool Shed.
- [x] **Replays that differ.** Every Local ride on Wiring Yard was identical: pools were exactly the size of a run, with one puzzle. Now 9 Local questions and 2 Local puzzles per line, unseen and shaky questions first, puzzles rotating ride by ride.

## Now: TypeScript

`npm run bar` lists exactly what each line is missing. On top of the gaps below, three TypeScript lines give their answers away by length (any vs unknown: the longest option is right on 9 of 10). Checked against TypeScript 6.0 and 7.0: `strict` is on by default since 6.0, and 7.0 is the same checker ported to Go, so the type rules carry over.

One line at a time, played before the next one starts.

- [x] **Narrow Gauge** clears the bar: 9 Local questions, two sorts (which check narrows which union, and the type at each spot in a function), a type predicate rehearsal, and the 5.5 inferred predicates on filter
- [ ] Fill tier 1 to 9 questions a line, so replays differ: about 30 across the other five lines
- [ ] Rehearsal to three prompts a line
- [ ] A sort line: utility types by what they operate on, object keys vs union members
- [ ] Two Local puzzles per line, so it is not six recognition quizzes in a row

## Then: React

Three React lines also give their answers away by length (performance: 8 of 9).

- [ ] Fill tier 1 to 9 questions a line: about 37 across the six lines
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
- [ ] **Split the bundle by division.** Every question ships in one chunk, now 517 kB (163 kB gzipped), past Vite's warning line. Loading each division's content lazily fixes it, but LINES is a synchronous array used everywhere, so it is a real refactor.

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
- **A replay should teach something.** If the second ride is the first ride again, it tests memory of the ride, not the material. Size pools well past a run and lead with what has not been seen.
- **Recognition is not recall, and recall is not speech.** Hence shaky drills and out-loud rehearsal. The interview tests the third one.
- **Concepts without the API is half a lesson.** Knowing a pipe validates input and not being able to name `ValidationPipe` is the gap between having read the docs and having used the thing.
- **Depth before breadth.** A division that cannot carry an interview on its own topic is not finished, and a new division does not fix it.
- **Check the docs, not memory.** NestJS 12 shipped after the first Nest lines were written. A pass against the current docs found rules stated as universal that were really Express defaults or ValidationPipe specifics. Say which version or adapter a claim depends on, and re-check a division when its framework ships a major version.
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
