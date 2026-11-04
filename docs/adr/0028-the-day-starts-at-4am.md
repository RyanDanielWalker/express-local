# 0028. The app's day starts at 4am

Status: Accepted (2026-11-04). Amends [ADR 0027](0027-early-rides-and-calendar-days.md).

## Context

ADR 0027 made a review due by calendar day. Ryan reviewed its consequences and wanted four of them fixed:

1. **The midnight edge.** A line cleared at 11:58pm was due at midnight, two minutes later.
2. **Readiness.** It started sliding at the exact due time, while the map said a line was due from midnight. The two disagreed for up to a day.
3. **The test time zone was set only in CI.** The clock-change test only bites in a zone with daylight saving. Setting it in `ci.yml` meant a local run in another zone tested something different.
4. **The results screen hid early rides.** After an early ride it still said "Next review in N days", with no sign the ride had not counted.

## Options for the midnight edge

1. **The day starts at 4am,** for reviews, the streak and the Daily Ride, the way flash-card apps like Anki do it. The two-minute edge does not vanish. It moves to a clear at 3:58am, when the player is almost always asleep.
2. **A review needs at least 12 hours** since the ride that scheduled it. Surgical, but it brings back a time-of-day rule, and the map could say a line is due for hours before it counts.

## Decision

Option 1, at Ryan's call. The rest followed from it:

- `DAY_STARTS = 4` in `src/engine/progression.ts`. `dayKey()` and `daysUntil()` treat anything before 4am as the day before. Reviews, the streak, the Daily Ride and badge dates all read the day through them, so there is one definition of "today". "Yesterday" for the streak is now `dayKey(addDays(now, -1))`, so a 23-hour day cannot skip it.
- Readiness counts lateness in whole days from the due day. A line is not late on the day it is due, which matches the map.
- `vite.config.ts` runs every test in New York time (`test.env.TZ`), locally and in CI alike. `ci.yml` no longer sets it.
- `finishTrip()` returns `early`. The results screen then says the ride was early, did not count as a review, and when the review is still due.

## Consequences

- A line cleared at 11:58pm is due from 4am the next day, about four hours later. A clear at 3:58am is still due two minutes later, at 4am.
- A ride at 1am counts toward the day before, for the streak and the Daily Ride as well as reviews. A late session no longer starts a new day halfway through.
- Saves need no change. `streak.last`, `daily` and the badge dates are still `YYYY-MM-DD` strings. A save written by a ride between midnight and 4am before this change holds the later date, which is harmless.
- Readiness now steps once a day instead of sliding by the hour.
- A test that builds dates runs in New York time, whatever zone the machine is in.
