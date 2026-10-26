# 0013. CI on GitHub Actions, one job, actions pinned to a commit

Status: Accepted (2026-10-26). Amended by [0016](0016-end-to-end-test-in-ci.md): the end-to-end test runs after the build.

## Context

1.0 needs CI on every push, and a deploy that waits for it ([ADR 0010](0010-a-portfolio-piece-with-a-1-0.md)). Pull requests need it too, so Ryan can merge on green ([ADR 0011](0011-branches-for-features.md)). Every check already exists as an npm script. What was missing was something that runs them without being asked.

## Options

1. **GitHub Actions.** The code is already on GitHub, so it needs no other account, and the result shows up on the pull request itself.
2. **Another CI service.** Another account to connect, for nothing Actions lacks here.
3. **A pre-push hook only.** It runs on one machine, it can be skipped, and a reviewer never sees it.

## Decision

Option 1, in one workflow, `.github/workflows/ci.yml`.

- **One job, in order:** format check, lint, typecheck, `npm test` (the bar included), the TypeScript probes, then the build. The checks are quick. Splitting them into parallel jobs would mostly add installs, because each job starts from a fresh machine.
- **Node from `.nvmrc`**, so CI and a local `nvm use` agree.
- **Actions pinned to a commit hash**, with the release name in a comment beside it. A tag like `v7` can be moved to different code later. A hash can't.
- **Least access.** The workflow can only read the repo, and checkout doesn't keep the token around.
- **`npm audit --omit=dev` reports without failing.** A new advisory can appear overnight with no change in the repo, and a red check for that would block unrelated work. `--omit=dev` limits it to what ships to the browser.
- **Only the TypeScript probes run.** `npm run check` gives one clear pass or fail. Some React and Nest probes are observation probes (they print what happened, and a person reads it), so there is no single pass or fail to run.

## Consequences

- A push that breaks formatting, lint, types, a test, a TypeScript probe or the build shows a red check on GitHub.
- Pinned hashes don't update themselves. Bumping an action means looking up the new release's commit and changing the hash and the comment together.
- The React and Nest probes are still run by hand when content changes, as [DEVELOPMENT.md](../DEVELOPMENT.md) says.
- The deploy item decides how a deploy waits for this check.
