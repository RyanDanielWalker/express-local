# 0003. React, TypeScript and Vite, with no backend

Status: Accepted. Decided earlier (2026-09-21), recorded 2026-10-17. The backend question is answered by [0010](0010-a-portfolio-piece-with-a-1-0.md): 2.0, not 1.0.

The original discussion was not written down. The context and options below are reconstructed from the code, the README and the roadmap.

## Context

Express & Local began as a single-file chat artifact. On 2026-09-21 it moved into a real repo. It is a study tool for one person, and also a portfolio piece.

## Options

1. **React 19, TypeScript, Vite, no backend.** Progress in `localStorage`, with a copy-and-paste save code to move between browsers. Matches the stack being drilled, deploys as static files.
2. **Next.js.** Routing and a server for free, but more framework than a client-only app needs.
3. **A full stack with a NestJS API and Postgres.** Cross-device sync, and a fuller NestJS showcase, but a weekend of work instead of an afternoon, and something to host and maintain.

## Decision

React 19, TypeScript (`strict`) and Vite 8, tested with Vitest, with no backend. Progress lives in `localStorage`.

## Consequences

- The app is a static site. It is not deployed yet; CI and deploying are on the roadmap.
- Progress does not sync between devices. The save code is the workaround.
- Saves must never break: new fields need a default and a migration (`emptySave()` and `migrate()` in `engine/save.ts`).
- The backend question stays open. The roadmap's "The fork" section holds the case for and against; the call is to revisit after the content bar is met.
- The repo builds with TypeScript 5.9 while some content teaches 6.0 behavior. Upgrading the build is a roadmap item.
