# 0022. Nothing waits on Ryan learning the code or writing it himself

Status: Accepted (2026-11-03). Amends [0010](0010-a-portfolio-piece-with-a-1-0.md) and [0018](0018-learn-mode-after-1-0.md).

## Context

Three roadmap items held the project until Ryan had learned how the app is built or written part of it himself. 1.0 needed him to pass an `/audit quiz` on the app's code and to write the case study in his own words, with Claude allowed to review it but not write it. The first item under Parked was a piece of core code written by Ryan with `/next learn`.

Ryan's call on 2026-11-03: Snippr is the project he learns end to end. Here he learns what the app teaches (NestJS, TypeScript, React, algorithms), not every piece of the app itself. Nothing else about how the work is done changes.

## Options

1. **Keep the gates.** 1.0 waits on the quiz and the case study, and the learn-mode piece comes first after it.
2. **Remove the gates, and keep the tools.** The work goes ahead without waiting on Ryan. `/audit quiz` and `/next learn` stay available for when he wants them.
3. **Remove the gates and the tools.** Simpler commands, but nothing is gained by deleting options he might use later.

## Decision

Option 2.

- 1.0's last item is the case study and the `v1.0` tag. `/audit quiz` is no longer part of 1.0.
- Claude writes the case study and Ryan reviews it like any other commit. It is written in the third person, like the README, and says Claude wrote it.
- The learn-mode piece leaves Parked.
- `/audit quiz` and `/next learn` stay as commands Ryan can run when he chooses.

## Consequences

- 1.0 is three steps from done: the case study, the tag, and the ADR that picks what comes next.
- Every other rule stays as it was: content is proven before it is committed, Ryan makes the calls and pushes, and the docs stay true.
- The README's **How this was built** section stays true as it is, since it already says Claude wrote most of the code and content.
