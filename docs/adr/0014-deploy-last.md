# 0014. The deploy moves to the end of 1.0, and the repo stays private until then

Status: Accepted (2026-10-26). Amends [0010](0010-a-portfolio-piece-with-a-1-0.md).

## Context

ADR 0010 put the deploy in Foundation, ahead of features, so every later change would be checked and shipped the same way. The deploy item then leaned toward making the repo public. Ryan is not ready to make the repo public yet.

Two things got mixed up there. A deploy puts the running app at a URL. A public repo lets anyone read the code and its history. Each can happen without the other. Most of Foundation's value was CI, and CI already runs on every push.

## Options

1. **Deploy last.** Move it to Ship 1.0 and decide public or private there. Nothing before it needs a deploy or a public repo.
2. **Deploy now from the private repo.** The CI workflow runs the deploy as its last step, so it still waits for the checks. The app is live before it is in the shape Ryan wants people to see.
3. **Drop the portfolio goal.** Back to a personal study tool, with no deploy and no 1.0. Ryan wants to show it eventually, so this gives up too much.

## Decision

Option 1. The repo stays private. The deploy is the first item of Ship 1.0, and the public or private decision is made there. 1.0 still needs a live public URL.

## Consequences

- Foundation is Prettier and ESLint, CI, save code validation and the end-to-end test.
- Until the deploy, the end-to-end test is the only check of the production build, so it runs against `npm run preview`.
- If the repo stays private at deploy time, branch protection is not available on the free plan. The deploy then runs as the last step of the CI workflow, after every check passes.
