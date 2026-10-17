# 0005. "Done" is a test, and finished stays finished

Status: Accepted. Decided earlier (2026-10-07), recorded 2026-10-17.

## Context

"Is this line good enough?" was being answered by feel. An audit found the correct answer was the longest option in 83% of questions, so picking the longest beat knowing the material. Fixing that by padding wrong answers then made the middle-length option right more than half the time. Nobody had noticed either problem by reading.

## Options

1. **A checklist in the roadmap, checked by hand.** Easy to write, easy to skip.
2. **A report script.** Shows the state, enforces nothing.
3. **Checks in code, run by the test suite, with a ratchet.** Every line is audited; divisions marked finished fail the tests if any line slips.

## Decision

The bar lives in `src/data/bar.ts`: a full run at every tier with 1.5x room to vary, two puzzles on Local, three rehearsal prompts, talking points and a gotcha, a puzzle that needs judgment, and no length position holding the answer on more than half a line's questions. `npm run bar` prints where each line stands. Divisions listed in `FINISHED` are enforced by `bar.test.ts`.

## Consequences

- NestJS, TypeScript and React are in `FINISHED`. Any change that drops one of their lines below the bar fails `npm test`.
- Algorithms show 0 of 11 because their game lines have no rehearsal or talking points. Expected while they are parked.
- The bar measures shape, not truth. Whether a claim is correct is [ADR 0006](0006-prove-claims-by-running-them.md)'s job.
- When a new kind of giveaway is found, it becomes a check, not a note.
