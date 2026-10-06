# Roadmap

Where this is going, what's parked, and what we learned building it. Not a contract. Delete anything that stops sounding like a good idea.

Status: 29 lines across 4 divisions, 72 tests, no backend.

## Next up

The reorganization. The page currently shows everything at once no matter what you're doing, which at 29 lines is too much.

- [ ] **Modes: deciding vs doing.** Boarding a line collapses the map, cram band and badges. The play screen gets the page. Cheapest change, biggest change in feel.
- [ ] **A Today band.** Top of the page answers "what should I do right now": reviews due, shaky questions waiting, the daily ride, next unlocked line. Divisions sit below it collapsed, each with its readiness bar, and you expand the one you're working on.
- [ ] **Badges become a count that opens a panel.** Sixteen permanent tiles is a lot of pixels for something you look at twice a week.
- [ ] **Tabs on the intro screen.** Ride / Field guide / Say it out loud. Right now it's one long scroll and the out-loud band gets buried.

## After that

- [ ] **A router.** Back button currently dumps you out of the app mid-ride, and you can't link anyone to a line. `/nest/life` should be a URL. Either react-router (what jobs use) or about 40 lines of hash router by hand (better interview story).
- [ ] **Split `App.tsx`.** It now owns the screen machine, cram pool assembly, drill line construction and answer recording. Pull out `useRun` and `useDrills`.
- [ ] **CI on push.** GitHub Actions running typecheck, tests and build. Small, and a green badge on the repo reads well.
- [ ] **Deploy it.** A live URL makes it a portfolio piece instead of a repo.
- [ ] **Keyboard shortcuts.** 1/2/3 to pick a quiz option, Enter to continue. Never got done.

## Content

Lines are data, so most of this is writing rather than building.

- [ ] **Scenario mode.** Read a real situation, pick the right algorithm or the right Nest building block. Tabled early on and still the best idea in this file.
- [ ] **Engineer's Cab.** After Rush Hour, write the algorithm yourself against in-browser tests.
- [ ] **SQL / Postgres division.** Joins, indexes, N+1, transactions, what an EXPLAIN is telling you. Directly relevant to the jobs being targeted.
- [ ] **Testing division.** What to test, mocking, `overrideProvider` in Nest, testing a component without testing React.
- [ ] **More NestJS.** Auth and JWT, TypeORM or Prisma, config and env, queues.
- [ ] **More React.** Forms, data fetching, error boundaries, accessibility.
- [ ] **More algorithms.** LRU cache, heaps, linked lists, topological sort, sliding window.
- [ ] **GraphQL.** Schema design, resolvers, the N+1 problem again from the other side.
- [ ] **Git as a train yard.** Rebase vs merge, what a detached HEAD actually is.

## Engine ideas

- [ ] **Diminishing returns.** The fourth ride of the same line in one day should pay less. Needs a new save field (rides per line per day), so it was left out rather than quietly changing the save format.
- [ ] **Interview mode.** Five random rehearsal prompts across divisions, timed, no retries. The closest thing to the real event.
- [ ] **Study plan.** Give it a date, get a daily plan that walks readiness up to where it needs to be by then.
- [ ] **"Stuck? Show me."** A voluntary hint button that costs a heart on purpose and marks that step shaky so it comes back. Deciding you are stuck is different from being handed the answer by accident.
- [ ] **Weekly report.** What decayed since last week, what to drill, nothing else.

## The fork

Whether this gets a backend.

**For:** the roles being targeted are NestJS and Postgres, and "this is the tool I built to prepare for this interview, and here's the Nest API behind it" is a strong artifact. Cross-device sync would also mean phone and laptop share progress, which a save code does not really solve.

**Against:** it stops being a static file you can open anywhere, and it's a weekend rather than an afternoon.

**Call:** keep it in the back pocket until the frontend reorganization is done. A dashboard with nothing behind it is a better demo than a sync API behind a cluttered map.

## Principles

Learned the hard way, mostly by getting them wrong first.

- **Measure, don't eyeball.** The correct answer was the longest option in 83% of questions before anyone counted. A test enforces it now.
- **A hint panel must never contain the answer.** The lifecycle hook was printed twice on screen while you solved the lifecycle puzzle.
- **Color means one thing everywhere.** Red is wrong, green is right, the line color is identity. Correct answers tinted with a red line color read as mistakes.
- **The headline number should be a state you can lose, not a total you accumulate.** XP measures time spent. Readiness measures what you'd recall today.
- **Pay for the weak stuff.** If replaying a mastered line is the best XP on the board, the scoring is teaching the wrong habit.
- **Content is data.** Lines live in `src/data/` and are validated by tests, so adding a topic is writing questions, not writing components.
- **Never answer the question for them.** Feedback on a miss should say that it was a miss, not what the answer was. The moment right after you find a gap in your own model is the one worth spending on retrieval, and a hint that arrives automatically is a hint you did not choose.
- **Recognition is not recall, and recall is not speech.** Hence shaky drills and out-loud rehearsal. The interview tests the third one.
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
