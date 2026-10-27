# 0017. Work goes on main by default; Ryan decides when something gets a branch

Status: Accepted (2026-10-27). Amends [0011](0011-branches-for-features.md), which put every roadmap item on a branch and through a pull request.

## Context

ADR 0011 gave every roadmap item its own branch and pull request, so review and CI would be visible before a change reached `main`. In practice, with one person on the project, it was ceremony: a branch, a push, a pull request description and a merge for every `/next`, with Ryan reviewing commits the same way either way. It also caused a slip. A docs commit was still uncommitted when a branch merged, and had to be redone on `main`.

Ryan has worked with branches and pull requests for years. Showing the process on every item does not prove anything a reviewer could not see from the history and CI.

## Options

1. **Keep 0011.** Visible process, at the cost of overhead on every item.
2. **Everything on `main`, always.** Least overhead, but no way to isolate something risky.
3. **`main` by default, a branch when Ryan asks for one.**

## Decision

Option 3.

- Claude commits on `main` unless Ryan asks for a branch. `/next` no longer creates a branch or drafts a pull request description on its own.
- When Ryan does ask, the branch and pull request work as 0011 describes, including the **Who wrote what** line from the template ([ADR 0012](0012-disclose-ai-in-the-readme.md)).
- Claude still never pushes. Ryan reviews the unpushed commits with `git log origin/main..HEAD` and pushes `main` himself.

## Consequences

- CI still runs on every push to `main`, so every change is still checked, just after it lands rather than before.
- A broken push lands on `main` directly. The pre-commit checks (`npm test`, `lint`, `format:check`) carry more of the weight.
- The rule about reformatting commits still applies if one is ever made on a branch: merge it with a merge commit, so the hash in `.git-blame-ignore-revs` survives.
