# 0025. Predict-first questions are required by the bar, not counted

Status: Accepted (2026-11-03). Amends [ADR 0024](0024-how-a-predict-first-guess-is-checked.md).

## Context

ADR 0024 kept predict-first questions out of the bar and left it to the inventory stop after the TypeScript block to decide whether to require them. That block is done. Every TypeScript line has at least one predict-first question on each tier, 19 in all, each proven under TypeScript 5.9, 6.0 and 7.0.

The audit at that stop ([audits/2026-11-03.md](../audits/2026-11-03.md)) pointed out the gap. The bar ignores them, and `data.test.ts` only checks their shape. So one edit could delete every predict-first question on a line, and every test would still pass. The bar exists to stop that kind of quiet slip ([ADR 0005](0005-the-bar-as-a-test-ratchet.md)).

## Options

1. **Leave them out.** No work, and no protection.
2. **Count them toward the pool sizes.** A line could then reach its pool on questions the player marks themselves. It buys nothing today, because the TypeScript lines clear without them.
3. **Keep them out of the counts, but require them.** Every quiz line in a division that has adopted predict-first needs at least one on each tier.

## Decision

Option 3, at Ryan's call.

- `PREDICTS` in `src/data/bar.ts` lists the divisions that have adopted them. It starts as TypeScript only.
- A new check, "A predict-first question at every tier", fails a quiz line in one of those divisions that has none on some tier. `npm run bar` names the missing tiers.
- The pool counts and the length checks still see only choice questions, as before.

## Consequences

- The 19 TypeScript questions are now defended like the rest of the bar. Moving one to another tier, or deleting it, fails `npm test` if it leaves a tier empty.
- React and NestJS do not fail before step 9 gives them predict-first questions. When they have one per tier on every line, they go in `PREDICTS`, and step 9 is not done until they do.
- A new TypeScript line needs three predict-first questions, one per tier, before it can count as finished.
