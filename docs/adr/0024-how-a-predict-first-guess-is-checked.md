# 0024. How a predict-first guess is checked

Status: Accepted (2026-11-03).

## Context

[ADR 0023](0023-predict-first-questions-after-1-0.md) picked predict-first questions as the block after 1.0. The player sees a snippet and guesses what it gives, before any options show. ADR 0023 left three calls open: how a guess is checked, whether these questions count toward the bar, and which tiers show them.

There were three ways to check a guess.

1. **Guess, then pick from options.** The player guesses, then the usual three options appear and scoring works as it does now. It reuses everything. But once the options show, the player can recognize the answer again, and recognizing is what this feature is meant to replace.
2. **Strict typed match.** The player types the answer, and the app compares it to a list of accepted spellings. It is fully objective. But one type can be written many ways. `string[]` and `Array<string>` are the same type. So a right answer gets marked wrong unless every spelling is listed, and each list would need proving too.
3. **Type it, then auto-match or self-mark.** The player has to type a guess before anything is revealed. If the guess matches the proven answer, it counts as right with no further step. If it does not, the player sees both side by side and says whether they had it. Rehearsal already works this way: the player marks each prompt nailed or shaky.

## Decision

Option 3, at Ryan's call. Predict-first questions do not count toward the bar yet. They show on every tier, by each question's own tier.

- **The guess is typed.** Nothing about the answer shows until there is a guess. Typing is what makes the player commit.
- **A match counts by itself.** The matching rule is a pure function in `src/engine/` with tests. It ignores spacing and the order of the members of a union, so `string | number` matches `number | string`. Anything it is not sure of goes to the player instead of being marked wrong.
- **Otherwise the player decides.** The screen shows the proven answer, the guess and the explanation, then asks "I had it" or "I missed it".
- **A miss is a miss.** It costs a heart and marks the question shaky, like a missed option question.
- **Not in the bar yet.** They are extra on top of it. Lines stay finished as they are, and React and NestJS do not fail the tests before step 9 gives them their own. The inventory stop after the TypeScript block revisits this.
- **Every tier.** Each one carries a tier like any question (1 Local, 2 Express, 3 Rush Hour) and is picked into runs the same way. Easy guesses go on Local, deep cuts on Rush Hour.

## Consequences

- Self-marking is an honor system. That is fine for an app with one player who wants to learn. It would not be fine for a scored test anyone else relies on.
- The matching rule can stay simple. When it does not match a guess, the player decides, so a right answer written another way is never marked wrong. The one thing it must never do is accept a wrong answer. Its tests include near misses that have to stay unmatched.
- The option rules do not apply to these questions, since they have no options: no three parallel claims and no length balancing. Each one still needs a proven answer, a `why` that teaches, and a probe with one check that should fail.
- The bar does not see them. Its count of questions on each tier has to leave them out, or a line could clear the bar on questions it was never meant to count. A line could also carry none and still clear it. Whether to require some is a call for the inventory stop, with the TypeScript block done to judge from.
- Because they go into the same pools, they also show up in cram and shaky drills, and their history is saved like any question's.
