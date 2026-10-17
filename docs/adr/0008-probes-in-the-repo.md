# 0008. The fact-check sandboxes live in the repo

Status: Accepted (2026-10-17).

## Context

[ADR 0006](0006-prove-claims-by-running-them.md) means every content claim gets proven against real code. Until now, the sandboxes that did that (React 19.3 in jsdom, NestJS 12.1.3, TypeScript 5.9, 6.0 and 7.0) lived in a temporary chat workspace and disappeared with it. Work is moving to Claude Code in a terminal ([ADR 0009](0009-terminal-workflow.md)), where each session starts fresh.

## Options

1. **In the repo, under `probes/`.** Committed with their own `package.json` files, kept out of the app's build and tests. Any session can run them, and the proofs travel with the content they prove.
2. **Outside the repo,** recreated from instructions. Keeps the repo lean, but setup becomes a manual step that is easy to skip.
3. **Docs only.** Skip running code. Fastest, and the standard the reviews showed misses real errors.

## Decision

Option 1. `probes/react`, `probes/nest` and `probes/ts`, each with pinned versions and the probes that proved the content as it stands, plus a shared `probes/README.md`.

## Consequences

- The app's `tsconfig.json`, Vitest config and build only look at `src/`, so probes never affect the app.
- Each probe folder installs its own dependencies (`npm install` inside it). `node_modules` and compiled `dist/` folders are ignored by git.
- Reviewer scratch work goes in a `_review/` folder inside each probe folder, which git ignores, so it never gets committed by accident and still uses that folder's pinned packages.
- When a framework version moves, bump its pin in `probes/`, re-run that folder, and fix whatever content the results contradict.
