# 0018. Ryan's own piece of core code moves to after 1.0

Status: Accepted (2026-10-27). Amends the written 1.0 from [0010](0010-a-portfolio-piece-with-a-1-0.md).

## Context

The 1.0 list in the roadmap asked for at least one piece of core code written by Ryan with `/next learn`. It was meant for the save-code validation, which was built in normal mode instead, so it moved to the Today band: picking what to do right now is a small pure function with tests, a good size for it.

When the Today band came up, Ryan said he does not want to do learn mode right now, and maybe after 1.0 ships.

## Options

1. **Keep it in 1.0.** 1.0 waits until Ryan wants to do it.
2. **Move it to after 1.0.** The Today band is built in normal mode, and the learn-mode piece goes with whatever comes next.
3. **Drop it.** Learn mode stays available but nothing asks for it.

## Decision

Option 2. The Today band is built in normal mode. 1.0 no longer needs a piece written with `/next learn`. Writing one is the first idea under Parked, for after `v1.0` is tagged.

## Consequences

- 1.0 is not held up by a step Ryan does not want to do yet.
- The case study and `/audit quiz` are still Ryan's own work in 1.0, so 1.0 still shows he can explain what was built.
- The README's **How this was built** section says nothing about a piece Ryan wrote until one exists.
