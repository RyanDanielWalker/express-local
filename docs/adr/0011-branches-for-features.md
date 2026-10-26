# 0011. Features go on a branch and through a pull request; small fixes stay on main

Status: Accepted (2026-10-26). Amends [0009](0009-terminal-workflow.md), which had every commit on local `main`.

## Context

Everything has been committed straight to `main`. Working alone, that is fast, but the repo shows no pull requests, so a reviewer looking at it cannot see review happening, and CI (coming in 1.0) would only run after a change is already on `main`. Snippr's playbook puts features on branches for the same reason.

## Options

1. **Everything on `main`.** Fast, but no visible review and no CI before merge.
2. **Everything on a branch.** Consistent, but a typo fix or a bit of padding does not need a pull request, and the overhead adds up.
3. **Features on a branch, small fixes on `main`.**

## Decision

Option 3.

- **A branch and a pull request** for a roadmap item: a feature, a content block (new or reworked questions), a refactor, or anything risky. Claude commits on a branch named for the item (`feat/router`, `content/near-duplicates`). Ryan pushes the branch, opens the pull request from `.github/pull_request_template.md`, and merges once CI is green.
- **Straight to `main`** for small changes: a docs fix, a wording tweak, moving a button, some padding, an inventory stop.

Claude still never pushes.

## Consequences

- `/next` starts each roadmap item by creating its branch, and drafts the pull request description in its report.
- Every pull request has a one-line **Who wrote what**, so a reader can see how the work was split.
- When unsure which kind a change is, it is a branch.
