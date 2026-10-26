# 0016. One end-to-end test with Playwright, run in CI

Status: Accepted (2026-10-26). Amends [0013](0013-ci-on-github-actions.md).

## Context

1.0 needs one end-to-end test that rides a line against the production build ([ADR 0010](0010-a-portfolio-piece-with-a-1-0.md)). Until the deploy, it is the only check that the built app works in a browser ([ADR 0014](0014-deploy-last.md)). The open question was whether it runs on every push or only by hand. Running it in CI adds a minute or two per push to download Chromium and ride the line. On a private repo, those minutes count against the plan's monthly Actions allowance.

## Options

1. **Run it in CI.** Every push and pull request checks the production build in a real browser. It costs those extra Actions minutes.
2. **Run it by hand only.** No extra CI time. A test that runs only when someone remembers tends to break quietly between runs.

## Decision

Option 1, Ryan's call.

- **Playwright, Chromium only**, pinned to an exact version. One browser is enough to show the build works. More browsers multiply the time for little gain in a small app.
- **Against `vite preview`**, after the build step, so CI tests the same files it just built.
- **Right answers come from `src/data`.** The test finds the question on screen in the line's content and clicks its answer. So it keeps working whichever questions a ride draws.
- **Two rides of Repaint Line.** Puzzles rotate from ride to ride, and that line has one Local flow and one Local sort, so two rides run both puzzle kinds.
- **CI settings on the command line** (`--forbid-only`, `--reporter=github`) rather than read from `process.env.CI` in the config, so Node's types stay out of the app's tsconfig.

## Consequences

- A push that breaks a ride, the results screen or the save code shows a red check, even when every unit test passes.
- Renaming a button the test clicks, or adding a Local puzzle to Repaint Line, fails the test until it is updated.
- Bumping Playwright means a new Chromium download. The version stays pinned, so that happens only on purpose.
