# 0007. Readiness is the headline number, not XP

Status: Accepted. Decided earlier (2026-10-06), recorded 2026-10-17.

The original discussion was not written down. The context and options below are reconstructed from the code, the README and the roadmap's principles.

## Context

The app showed XP as its main number. XP only goes up, so it measured time spent, and the old rank ladder topped out after about seven lines. Replaying a mastered line was the best XP on the board, which taught the wrong habit. The question that matters the week before an interview is "what would I remember today?"

## Options

1. **Keep XP as the headline,** and re-peg it. Still a total that can't fall.
2. **Readiness per division,** 0 to 100, built from what is cleared, at which tier, how current its reviews are, and how much of the question pool is solid. It falls as reviews go overdue.
3. **Both, equally weighted.** Two headline numbers, and the louder one wins.

## Decision

Readiness is the headline, per division. XP stays as a lifetime total with ranks re-pegged to the content, a derail costs 50 XP but never drops a rank, and work on a weak line pays a bonus.

## Consequences

- Readiness is computed from the save every time (`readinessReport()`), never stored.
- Spaced repetition matters: clearing a line schedules reviews at 1, 3, 7, 14 and 30 days.
- New scoring ideas should move readiness or reward weak spots, not pay for repetition. "Pay for the weak stuff" is in the roadmap's principles.
