# Case study: Express & Local

Written by Claude, the AI pair programmer that wrote most of this project's code and content, at Ryan Walker's request ([ADR 0022](adr/0022-nothing-waits-on-ryan-learning-the-code.md)). Ryan reviews it like any other commit. It covers what was built, what broke, what was decided and why, and how the two worked together. Every claim in it can be traced to the git history, the [roadmap](ROADMAP.md), the [decision records](adr/) or the [first audit](audits/2026-10-29.md).

## The problem

Ryan was preparing for technical interviews on his own stack: NestJS, TypeScript and React, plus algorithms. Reading docs and flashcards left two gaps.

1. **Recognizing an answer is not the same as giving one.** A flashcard asks "is this right?" An interviewer asks "explain it."
2. **He could not check the material himself.** He was still learning it, so a wrong claim would look as plausible to him as a right one. He would learn it, then repeat it in an interview.

So the app had to do two things: drill the material the way an interview does, and be right.

## What was built

A browser app themed as a subway system ([ADR 0001](adr/0001-subway-theme.md)). Each topic is a line. Each line has three tiers: Local, Express and Rush Hour, the same route at rising difficulty.

- **34 lines in four divisions.** Algorithms (11 lines) are hand-built games, like playing breadth-first search by clicking stations while the queue fills. NestJS (9), React (8) and TypeScript (6) are question lines.
- **394 questions and 56 puzzles** across the three stack divisions. A ride asks questions, then usually ends on a puzzle: a sort (cards into the right box) or a flow (the steps of a process, in order, with decoy steps that do not happen).
- **Out-loud rehearsal** on every stack line: answer in full sentences, then compare against a model answer.
- **Readiness, not points.** The headline number is a 0 to 100 score per division that falls as reviews go overdue. Clearing a line schedules spaced reviews at 1, 3, 7, 14 and 30 days.
- **No backend.** React 19, TypeScript and Vite. Progress lives in the browser, with a save code to move it between browsers ([ADR 0003](adr/0003-stack.md)).
- **Live** at https://express-local.ryandanielwalker.workers.dev, deployed to Cloudflare by CI only after every check passes ([ADR 0021](adr/0021-deploy-to-cloudflare-from-ci.md)).

The work ran from 2026-09-21 to 2026-11-03, in about 220 commits.

## How it was built

### Content is data, and game rules are pure functions

A line is a typed object in `src/data/`: its questions, puzzles, rehearsal prompts and study notes. A few shared components play any question line. Adding a topic means writing questions, not components ([ADR 0004](adr/0004-content-as-typed-data.md)).

Game rules and scoring live in `src/engine/` and `src/algorithms/` as plain functions. They take a state and a move, and return the next state. Components render that state and never decide what is correct. That made the rules testable without a browser. For example, the tests play every algorithm game perfectly and compare the result against a reference implementation.

### Every claim is proven by running it

This is the decision that shaped the project most ([ADR 0006](adr/0006-prove-claims-by-running-them.md)). Content was first checked by reading it against the official docs. That kept missing errors. So every claim now has to pass real code before it is committed:

- **TypeScript** claims compile under TypeScript 5.9, 6.0 and 7.0 with `strict` on, with type assertions that fail if the claim is wrong.
- **React** claims render with React 19.3 in a simulated browser (jsdom), counting renders and watching the page change.
- **NestJS** claims run as small Nest 12.1.3 apps that a test sends real HTTP requests to.

The wrong options get proven wrong too. A wrong option that a knowledgeable person could defend counts as a bug. Each proof includes one check that is supposed to fail, to show the proof can fail at all. These sandboxes live in `probes/`, so every claim's proof can be run again ([ADR 0008](adr/0008-probes-in-the-repo.md)).

Then a second agent that did not write the content reviews it, before each block of work closes. Its findings are checked by re-running the probe before anything changes, because the reviewer can be wrong too.

### "Done" is a test

Whether a line was good enough used to be judged by feel. Now `src/data/bar.ts` defines it ([ADR 0005](adr/0005-the-bar-as-a-test-ratchet.md)). A finished line has enough questions that a replay differs from the last ride, two puzzles on Local, three rehearsal prompts, study notes with a common mistake, and answers that cannot be guessed by their length. Once a division is marked finished, a line that slips below the bar fails the test suite, so finished stays finished.

### Checks before features, the deploy last

Formatting, lint, CI and an end-to-end test went in before the interface work, so every later change was checked the same way ([ADR 0013](adr/0013-ci-on-github-actions.md), [ADR 0016](adr/0016-end-to-end-test-in-ci.md)). At the `v1.0` tag, CI ran the format check, lint, typecheck, 153 unit and content tests, the TypeScript proofs, a production build and two browser tests on every push. The browser tests ride a real line against the production build, run an accessibility scanner (axe) on every screen they pass, and check text contrast in light and dark mode ([ADR 0020](adr/0020-accessibility-as-tests.md)).

## What broke, and what it taught

Most of the rules in this repo exist because something went wrong first.

**The answer was usually the longest option.** A count on 2026-10-06 found the correct answer was the longest option in 83% of questions. Picking the longest beat knowing the material. The fix, padding the wrong options, made the middle-length option right more than half the time on four lines. Nobody had noticed either problem by reading. Now a test fails any answer much longer than its alternatives, and the bar fails a line where the answer sits in the same length position on more than half its questions. The lesson, recorded as the first principle on the roadmap: measure, don't eyeball.

**Reading the docs was not enough.** Running the content as code found claims the docs seemed to support but the code did not:

- A "wrong" TypeScript option that actually narrowed correctly.
- An explanation that said React stops an effect loop. React only warns, and the loop keeps running.
- A claim that StrictMode remounts a component for real. It runs the effect's setup, cleanup and setup again, but keeps the state.
- In NestJS, a missing `@Injectable()` listed as a cause of a startup error. The app actually starts, with the dependency undefined, and the first request that uses it fails.

The independent reviews then found 8 wrong and about 20 misleading items in TypeScript, and 55 items to fix in React. Each was re-proven and re-checked before the division counted as finished.

**The puzzles answered themselves.** A flow puzzle showed the correct step after a wrong click, so a wrong click became the cheapest hint in the app. A hint panel printed the answer to the puzzle beside it. Red meant correct in one place. Each was fixed, and each became a rule: never answer the question for the player, a hint must never contain the answer, and red always means wrong.

**One bad field could wipe a save.** A save was trusted as it was, whether it came from the browser's storage or a pasted code. A wrong type in one field made the loader throw, so a slightly damaged save loaded as an empty one, wiping progress. Now `migrate()` rebuilds the save field by field. A wrong type gets its default and an unreadable entry is dropped ([ADR 0015](adr/0015-repair-damaged-saves.md)).

**Drills ended on the wrong line.** The first audit, run on 2026-10-29, found that running out of hearts in a mixed drill showed the selected line's study notes, and "Try again" started a ride on that line instead of the drill. A visitor could hit it from the first screen. It was fixed before the deploy, with a second browser test that covers it.

**Context got lost between chat sessions.** The project began in long chat sessions, and what was decided lived in those chats. When a chat ended, the decisions went with it. On 2026-10-17 the work moved into the repo: a roadmap, decision records, a development guide, and a `CLAUDE.md` with the rules and known traps ([ADR 0009](adr/0009-terminal-workflow.md)). Every session since starts from those files, not from memory.

**Dense wording.** Correct content still failed if it needed reading twice. A clarity standard was written on 2026-10-13: one idea per sentence, the example before the name for it, every term defined the first time it matters. All three stack divisions were rewritten to it, and each rewrite was proven again, because rewording an option can make it true.

## Decisions, and who made them

Ryan made the calls. These are the ones that shaped the project most:

- **Depth before breadth.** One division finished completely, in the order NestJS, TypeScript, React, before the next. Algorithms wait ([ADR 0002](adr/0002-depth-first.md)).
- **Readiness over XP.** A total that only goes up measures time spent. Readiness can drop, which is what makes it useful the week before an interview ([ADR 0007](adr/0007-readiness-over-xp.md)).
- **A written 1.0, then a freeze.** Seven checkable items. After they were set, new findings went to a parked list unless they were a security hole, a bug a visitor would hit, or embarrassing on the first screen ([ADR 0010](adr/0010-a-portfolio-piece-with-a-1-0.md)). A backend is 2.0.
- **Branches, then not.** Every item went through a branch and pull request for a while. With one person reviewing every commit either way, it was ceremony. It also caused a slip: a docs change was still uncommitted when its branch merged, and had to be redone. Work went back to `main` by default ([ADR 0017](adr/0017-main-by-default.md)).
- **A small router instead of a library.** Five URL shapes did not justify a dependency. About a hundred lines on the browser's History API make Back work mid-ride ([ADR 0019](adr/0019-a-small-router-of-our-own.md)).
- **Keep the line colors, fix the contrast.** Dark mode put white text on bright yellow at 1.7:1, far below the 4.5:1 that normal-size text needs. The line colors stayed, and the text drawn on them changed ([ADR 0020](adr/0020-accessibility-as-tests.md)).
- **Cloudflare, from a public repo**, with a strict Content-Security-Policy that the browser tests also run under ([ADR 0021](adr/0021-deploy-to-cloudflare-from-ci.md)).
- **Nothing waits on Ryan learning the app's code.** This project teaches NestJS, TypeScript and React. His other project, Snippr, is the one he learns end to end. So 1.0 stopped waiting on a quiz about the app's code, and on Ryan writing this case study himself ([ADR 0022](adr/0022-nothing-waits-on-ryan-learning-the-code.md)).

## How Ryan worked with Claude

The split was set out in [ADR 0009](adr/0009-terminal-workflow.md) and held for the rest of the project.

- **Ryan owned the project.** He set the direction, made the product calls and tradeoffs, reviewed every commit, and pushed every one himself. He is the author of the commits because the author is the person responsible for them.
- **Claude was the senior engineer.** It wrote the code and the content, proved the content, kept the docs true in the same commits, and explained each piece of work in plain English. It committed but never pushed.
- **A command ran the loop.** `/next` took the top item off the roadmap, planned it, stopped to ask when a decision was Ryan's, built and proved it, and reported what shipped and which commit most needed his review.
- **Review came from outside the author.** A separate fact-checker agent reviewed content it had not written. An `/audit` command gave an outsider's review of the whole project at the end of a phase.
- **The repo carried the context.** Anything a later session needed (a decision, a trap, an unfinished thread) went into the docs before the session ended. The **Known traps** section of `CLAUDE.md` is the record of that habit.

The use of AI is disclosed in the README's **How this was built** section rather than in commit trailers ([ADR 0012](adr/0012-disclose-ai-in-the-readme.md)). Most commits up to `c1e7326` carry a Claude co-author trailer from before that decision.

What this arrangement did not give Ryan is a line-by-line understanding of the app's own code. Almost none of the code in the history is his own. His review was of what each commit did and why. The material the app teaches is what he studies, by playing it.

## What is not done

Honest limits, all recorded on the [roadmap](ROADMAP.md) under **Parked**:

- **The algorithm lines are behind.** They were not written to the clarity standard, do not clear the bar, and six of the games keep their helper panels on at Rush Hour.
- **`App.tsx` has no tests of its own.** The drill-ending bug lived there. Splitting it into smaller pieces that can be tested is parked.
- **Keyboard focus does not move to new content** when a screen changes, which slows a keyboard player down in flow puzzles.
- **Riding a line every day can keep its review from ever coming due**, because an early ride resets the timer without moving the line up a box.
- **The bundle is over 700 kB**, with every question in one file.

## Results

At the `v1.0` tag:

- 34 lines. All 23 NestJS, React and TypeScript lines clear the bar, and the test suite keeps them there.
- 394 questions and 56 puzzles in those divisions. Every claim is proven against the compiler or running code. Each division was independently reviewed before it counted as finished. Later changes are proven the same way and go to the same reviewer in batches.
- 153 unit and content tests, two browser tests against the production build, and CI that deploys only on green.
- Tagged `v1.0` on 2026-11-03.
- 23 decision records explaining why the project is the way it is.
