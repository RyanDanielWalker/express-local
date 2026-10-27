# 0010. A portfolio piece with a written 1.0, and the backend is 2.0

Status: Accepted (2026-10-26). Amended by [0014](0014-deploy-last.md): the deploy moves to the end of 1.0. Amended by [0018](0018-learn-mode-after-1-0.md): Ryan's learn-mode piece moves to after 1.0.

## Context

Express & Local has been a study tool for one person: it runs locally, and "done" was defined per line (the bar) but never for the project. Snippr, Ryan's other project, produced a playbook for portfolio projects: a short written 1.0 that a visitor could check, frozen once its phases are set, so the project actually finishes. The roadmap also held an open question, "The fork": whether the app gets a NestJS and Postgres backend.

## Options

1. **Stay a personal tool.** No deploy, no CI, nothing to finish. Cheapest, but nobody else sees it, and it never becomes something to talk about in an interview.
2. **Both: a study tool that is also a portfolio piece, with a static 1.0.** Deploying static files is an afternoon. Progress already lives in the browser, so a visitor gets a working demo with no sign-up. The backend waits.
3. **Both, with the backend in 1.0.** The strongest NestJS showcase, but it adds auth, a database, migrations and hosting to 1.0, and pushes the finish line back by weeks.

## Decision

Option 2. The 1.0 definition is at the top of `docs/ROADMAP.md`. Once its phases are set, it is frozen: new findings go to Parked unless they are a security hole, a bug a visitor would hit, or embarrassing on the first screen.

The backend is 2.0. It answers "The fork" from ADR 0003: not now, and not as part of 1.0.

## Consequences

- Foundation work moves ahead of features: Prettier and ESLint, CI, a deploy that waits on CI, and an end-to-end test.
- The interface list shrinks to what a visitor notices. The rest of it moves to Parked.
- The case study and the `v1.0` tag are 1.0 items, not afterthoughts.
- If 2.0 happens, the backend half of the Snippr playbook is its plan: auth first, ownership checked on every query, real migrations, and a guard that keeps local scripts off the production database.
