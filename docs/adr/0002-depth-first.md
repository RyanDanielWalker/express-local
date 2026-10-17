# 0002. Depth first: finish a division before starting the next

Status: Accepted. Decided earlier (2026-10-07), recorded 2026-10-17.

## Context

The app started as algorithm games, then grew NestJS, React and TypeScript divisions quickly. By early October there were four divisions, each with thin pools: a replay was the same run again, some lines could not fill a full run at every tier, and a few answers were guessable by length. The interviews this app prepares for test NestJS, TypeScript and React, so the stack divisions matter most.

## Options

1. **Breadth.** Keep adding divisions (SQL, GraphQL, Git). More coverage, all of it shallow.
2. **Depth, one division at a time.** Bring each stack division to a measurable "done" before touching the next.
3. **Depth everywhere at once.** Raise all divisions in parallel. Progress is harder to see, and loose threads multiply.

## Decision

Depth, one division at a time, in this order: NestJS, then TypeScript, then React. Algorithms wait. A division is done when every line clears the bar ([ADR 0005](0005-the-bar-as-a-test-ratchet.md)), every claim has been proven ([ADR 0006](0006-prove-claims-by-running-them.md)) and independently reviewed, the gaps the review found are filled, and the division could carry an interview on its own topic. No loose threads: anything found along the way is fixed or written on the roadmap.

## Consequences

- All three stack divisions reached done by 2026-10-16, in that order.
- Algorithms are still parked: their game lines have no question pools or rehearsal, so they show 0 of 11 on the bar. That is expected, not a regression.
- New divisions (SQL and Postgres, GraphQL) stay parked until the current roadmap items are done.
- Inventory stops between blocks of work (a fact-check and a sanity pass) are part of the plan, not extra.
