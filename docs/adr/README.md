# Architecture decision records

One file per significant decision: the context, the options, what was decided, and what follows from it. They explain why the project is the way it is, so nobody has to dig through old chats.

## Rules

- **Append-only.** Never rewrite a decision. If it changes, write a new ADR that says which one it amends or replaces, and add a line to the old one's status pointing at the new one.
- **Thorough, not padded.** Long enough that someone who wasn't there understands the decision: what forced it, each option with its real cost, what was picked, and what follows. A new term gets a plain definition and a small example. Link to the roadmap or the code for detail rather than copying it ([0030](0030-docs-to-learn-from.md)).
- **Numbered in order.** `NNNN-short-title.md`, next free number.
- Decisions made before this folder existed are marked "Decided earlier, recorded 2026-10-17".

## Index

| #                                                       | Decision                                                                                        | Status                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [0001](0001-subway-theme.md)                            | The app is a subway system                                                                      | Accepted                                 |
| [0002](0002-depth-first.md)                             | Depth first: finish a division before starting the next                                         | Accepted                                 |
| [0003](0003-stack.md)                                   | React, TypeScript and Vite, with no backend                                                     | Accepted, backend answered by 0010       |
| [0004](0004-content-as-typed-data.md)                   | Content is typed data in `src/data/`                                                            | Accepted                                 |
| [0005](0005-the-bar-as-a-test-ratchet.md)               | "Done" is a test, and finished stays finished                                                   | Accepted                                 |
| [0006](0006-prove-claims-by-running-them.md)            | Content claims are proven by running code, not just by reading docs                             | Accepted                                 |
| [0007](0007-readiness-over-xp.md)                       | Readiness is the headline number, not XP                                                        | Accepted                                 |
| [0008](0008-probes-in-the-repo.md)                      | The fact-check sandboxes live in the repo                                                       | Accepted                                 |
| [0009](0009-terminal-workflow.md)                       | Day-to-day work happens in Claude Code, and the repo carries the context                        | Accepted, amended by 0011                |
| [0010](0010-a-portfolio-piece-with-a-1-0.md)            | A portfolio piece with a written 1.0, and the backend is 2.0                                    | Accepted, amended by 0014, 0018 and 0022 |
| [0011](0011-branches-for-features.md)                   | Features go on a branch and through a pull request; small fixes stay on main                    | Accepted, amended by 0017                |
| [0012](0012-disclose-ai-in-the-readme.md)               | AI use is disclosed in the README, not in commit trailers                                       | Accepted                                 |
| [0013](0013-ci-on-github-actions.md)                    | CI on GitHub Actions, one job, actions pinned to a commit                                       | Accepted, amended by 0016 and 0021       |
| [0014](0014-deploy-last.md)                             | The deploy moves to the end of 1.0, and the repo stays private until then                       | Accepted, amended by 0021                |
| [0015](0015-repair-damaged-saves.md)                    | A damaged save is repaired field by field, not rejected                                         | Accepted                                 |
| [0016](0016-end-to-end-test-in-ci.md)                   | One end-to-end test with Playwright, run in CI                                                  | Accepted                                 |
| [0017](0017-main-by-default.md)                         | Work goes on main by default; Ryan decides when something gets a branch                         | Accepted                                 |
| [0018](0018-learn-mode-after-1-0.md)                    | Ryan's own piece of core code moves to after 1.0                                                | Accepted, amended by 0022                |
| [0019](0019-a-small-router-of-our-own.md)               | A small router of our own, with path URLs                                                       | Accepted                                 |
| [0020](0020-accessibility-as-tests.md)                  | Accessibility is checked by tests: axe in the end-to-end test, and contrast from the stylesheet | Accepted                                 |
| [0021](0021-deploy-to-cloudflare-from-ci.md)            | Deploy to Cloudflare from CI, from a public repo                                                | Accepted                                 |
| [0022](0022-nothing-waits-on-ryan-learning-the-code.md) | Nothing waits on Ryan learning the code or writing it himself                                   | Accepted, amended by 0031                |
| [0023](0023-predict-first-questions-after-1-0.md)       | After 1.0, predict-first questions come first                                                   | Accepted                                 |
| [0024](0024-how-a-predict-first-guess-is-checked.md)    | How a predict-first guess is checked                                                            | Accepted, amended by 0025                |
| [0025](0025-predict-first-questions-in-the-bar.md)      | Predict-first questions are required by the bar, not counted                                    | Accepted                                 |
| [0026](0026-fix-early-rides-next.md)                    | After the predict-first TypeScript block, fix early rides                                       | Accepted                                 |
| [0027](0027-early-rides-and-calendar-days.md)           | A review is due by calendar day, and an early ride leaves it alone                              | Accepted, amended by 0028 and 0029       |
| [0028](0028-the-day-starts-at-4am.md)                   | The app's day starts at 4am                                                                     | Accepted                                 |
| [0029](0029-date-edges-from-the-third-audit.md)         | Due dates sit at noon, and a due date no ride could set is due now                              | Accepted                                 |
| [0030](0030-docs-to-learn-from.md)                      | Docs are written to be learned from, and nothing is left for Ryan to fill in                    | Accepted                                 |
| [0031](0031-reviews-named-for-who-ran-them.md)          | Reviews are named for who ran them                                                              | Accepted                                 |
| [0032](0032-block-git-push-with-a-permission-rule.md)   | Stop Claude from pushing with a permission rule                                                 | Accepted                                 |

## Template

```markdown
# NNNN. Title

Status: Accepted (YYYY-MM-DD). Amends/replaces NNNN, if it does.

## Context

What forced a decision.

## Options

The real alternatives, each with its cost.

## Decision

What we picked.

## Consequences

What follows, good and bad. What to watch for.
```
