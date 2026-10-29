# Architecture decision records

One short file per significant decision: the context, the options, what was decided, and what follows from it. They explain why the project is the way it is, so nobody has to dig through old chats.

## Rules

- **Append-only.** Never rewrite a decision. If it changes, write a new ADR that says which one it amends or replaces, and add a line to the old one's status pointing at the new one.
- **Short.** A page at most. Link to the roadmap or the code for detail.
- **Numbered in order.** `NNNN-short-title.md`, next free number.
- Decisions made before this folder existed are marked "Decided earlier, recorded 2026-10-17".

## Index

| #                                            | Decision                                                                                        | Status                             |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------- |
| [0001](0001-subway-theme.md)                 | The app is a subway system                                                                      | Accepted                           |
| [0002](0002-depth-first.md)                  | Depth first: finish a division before starting the next                                         | Accepted                           |
| [0003](0003-stack.md)                        | React, TypeScript and Vite, with no backend                                                     | Accepted, backend answered by 0010 |
| [0004](0004-content-as-typed-data.md)        | Content is typed data in `src/data/`                                                            | Accepted                           |
| [0005](0005-the-bar-as-a-test-ratchet.md)    | "Done" is a test, and finished stays finished                                                   | Accepted                           |
| [0006](0006-prove-claims-by-running-them.md) | Content claims are proven by running code, not just by reading docs                             | Accepted                           |
| [0007](0007-readiness-over-xp.md)            | Readiness is the headline number, not XP                                                        | Accepted                           |
| [0008](0008-probes-in-the-repo.md)           | The fact-check sandboxes live in the repo                                                       | Accepted                           |
| [0009](0009-terminal-workflow.md)            | Day-to-day work happens in Claude Code, and the repo carries the context                        | Accepted, amended by 0011          |
| [0010](0010-a-portfolio-piece-with-a-1-0.md) | A portfolio piece with a written 1.0, and the backend is 2.0                                    | Accepted, amended by 0014 and 0018 |
| [0011](0011-branches-for-features.md)        | Features go on a branch and through a pull request; small fixes stay on main                    | Accepted, amended by 0017          |
| [0012](0012-disclose-ai-in-the-readme.md)    | AI use is disclosed in the README, not in commit trailers                                       | Accepted                           |
| [0013](0013-ci-on-github-actions.md)         | CI on GitHub Actions, one job, actions pinned to a commit                                       | Accepted, amended by 0016          |
| [0014](0014-deploy-last.md)                  | The deploy moves to the end of 1.0, and the repo stays private until then                       | Accepted                           |
| [0015](0015-repair-damaged-saves.md)         | A damaged save is repaired field by field, not rejected                                         | Accepted                           |
| [0016](0016-end-to-end-test-in-ci.md)        | One end-to-end test with Playwright, run in CI                                                  | Accepted                           |
| [0017](0017-main-by-default.md)              | Work goes on main by default; Ryan decides when something gets a branch                         | Accepted                           |
| [0018](0018-learn-mode-after-1-0.md)         | Ryan's own piece of core code moves to after 1.0                                                | Accepted                           |
| [0019](0019-a-small-router-of-our-own.md)    | A small router of our own, with path URLs                                                       | Accepted                           |
| [0020](0020-accessibility-as-tests.md)       | Accessibility is checked by tests: axe in the end-to-end test, and contrast from the stylesheet | Accepted                           |

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
