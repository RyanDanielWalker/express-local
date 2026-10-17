# 0006. Content claims are proven by running code, not just by reading docs

Status: Accepted. Decided earlier (TypeScript 2026-10-13, NestJS 2026-10-15, React 2026-10-16), recorded 2026-10-17.

## Context

Ryan is still learning this material, so he cannot catch a wrong claim in review. Everything depends on the content being right. Rereading content against the docs kept missing errors:

- TypeScript: two wrong claims that `tsc` caught in seconds, including a "wrong" option that actually narrowed correctly.
- NestJS: claims the docs supported but Nest 12.1.3 did not, like `@HttpCode()` still applying alongside `@Res()`, and a missing `@Injectable()` listed as a cause of "can't resolve dependencies" (it boots, with an undefined dependency).
- React: an effect loop React was said to stop (it only warns, and the loop runs on), StrictMode described as a real remount (it keeps state), and error boundaries said to catch only rendering errors (they also catch errors in effects and Actions).

## Options

1. **Check against official docs.** Fast, but the docs are sometimes behind, ambiguous, or describe a default as a rule.
2. **Docs, then prove it.** Write each claim as code and run it against the real framework, including the wrong options.
3. **Prove it, then have someone else try to break it.** Option 2, plus an independent reviewer that did not write the content.

## Decision

Option 3. The docs are where a claim starts, and running code is the proof:

- TypeScript claims compile under 5.9, 6.0 and 7.0 with `strict` on, with type assertions that can fail.
- React claims render with react-dom 19.3 in jsdom, in development and production when it matters.
- NestJS claims run as small Nest 12.1.3 apps on the Express adapter, hit with supertest.
- Every probe includes one check that should fail. Wrong options are proven wrong, not just right ones right.
- Before an inventory stop, a separate agent that did not write the content fact-checks it. Each finding is verified by re-running its probe before anything changes, and a fresh agent re-checks the fixes.
- Content commits say what they were checked against.

## Consequences

- Content work is slower, and worth it: every independent review so far found real errors that this process then caught.
- The sandboxes have to exist wherever the work happens. See [ADR 0008](0008-probes-in-the-repo.md).
- Version-specific behavior is stated in the content ("since React 19.2", "on the default Express adapter"). When a framework ships a major version, its division gets re-checked.
- The full procedure is in [DEVELOPMENT.md](../DEVELOPMENT.md#checking-content).
