# 0026. After the predict-first TypeScript block, fix early rides

Status: Accepted (2026-11-03).

## Context

[ADR 0023](0023-predict-first-questions-after-1-0.md) said the next pick from Parked comes at the inventory stop after the predict-first TypeScript block. That stop was on 2026-11-03, with its audit in [audits/2026-11-03.md](../audits/2026-11-03.md).

One parked bug is about reviews. Each line sits in a box on a 1, 3, 7, 14 and 30 day schedule. Any ride resets the line's due date to now plus its box's gap, but only a ride that was due moves the box (`finishTrip()` in `src/engine/progression.ts`). So clear a line at 8pm, then ride it at 7pm every day after. It is never due when ridden, so it stays in the first box and no review is ever counted. The app's own Daily Ride can lead there, since it picks from every unlocked line. Ryan plays every day, so this skews his own review history a little more each day. "How does review scheduling work?" is also a likely interview question about this app.

## Options

1. **Fix early rides as a short block, then React and NestJS predict-first questions.** Small to medium. It needs one design call: whether an early ride leaves the due date alone, whether due is compared by calendar day, or both. No save field is needed.
2. **React and NestJS predict-first questions straight away.** Large: two new kinds of answer, each with its own matching rule, and probes in jsdom and Nest. The bug keeps adding up meanwhile.
3. **Split `App.tsx` first,** so its wiring can be tested. Medium to large, and no player would notice.

## Decision

Option 1, at Ryan's call. It becomes step 9 of **Next, in order**. React and NestJS predict-first questions move to step 10.

## Consequences

- The design call (leave due alone, calendar days, or both) is the first item of the block, and Ryan makes it. The fix is a pure change in `src/engine/` with a test that replays the 8pm-then-7pm example.
- Saves need no new field.
- The rest of Parked stays parked. Focus after a screen changes is the strongest candidate after step 10, since predict-first questions added another screen where focus lands on the page.
