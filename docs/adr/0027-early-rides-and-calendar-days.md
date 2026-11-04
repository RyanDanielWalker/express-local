# 0027. A review is due by calendar day, and an early ride leaves it alone

Status: Accepted (2026-11-04), amended by [0028](0028-the-day-starts-at-4am.md). Makes the design call that [ADR 0026](0026-fix-early-rides-next.md) left open.

## Context

Each cleared line sits in a box on a 1, 3, 7, 14 and 30 day schedule. Before this decision, `finishTrip()` set the due date to the exact moment of the ride plus the box's gap, after every ride. Only a ride at or after that moment counted as a review and moved the box.

That fails two ways:

1. **Time of day.** Clear a line Monday at 8pm. It is due Tuesday at 8pm. A ride Tuesday at 7pm is an hour early, so it counts for nothing and moves the due date to Wednesday at 7pm. A day is lost.
2. **Riding days early.** A line on a 3-day gap, ridden every day, gets its due date pushed back three days each time. It never comes due. The Daily Ride can lead here, since it picks from every unlocked line.

Together: clear a line at 8pm and ride it at 7pm every day. Tuesday's ride is early. Wednesday's lands exactly on time and moves the line to the 3-day box. After that, no ride ever counts again. Earlier write-ups said no review ever counts; a test of ten such days found one.

## Options

1. **Compare by calendar day only.** "Due Tuesday" means any time Tuesday. Fixes case 1, not case 2.
2. **An early ride leaves the due date alone, only.** Fixes case 2. Case 1 still makes the player wait until 8pm on the due day.
3. **Both.** Fixes both cases. The second audit ([audits/2026-11-03.md](../audits/2026-11-03.md)) recommended it.

## Decision

Option 3, at Ryan's call.

- `isDue()` compares calendar days in the player's time zone. A line is due from the start of its due day.
- A new due date is the same clock time a whole number of calendar days later (`addDays()`), so a daylight saving change cannot skip or repeat a day.
- Only a first clear or a due ride sets the box and the due date. An early ride is extra practice: it still earns XP, raises the tier and counts toward the streak, but the box and the due date stay where they were.

## Consequences

- CI runs the tests in New York time. A test schedules a review from 11:30pm on every day of a year, and only a zone with daylight saving has the 23-hour day that would catch a review pushed a day late.
- No save field. `due` is still a timestamp; only how it is read changed. Old saves keep working.
- Practicing a line early can no longer delay its review, and riding it on its due day always counts, whatever the time.
- The results screen's "Next review in N days" and the intro's "review in N days" count calendar days, so they match what the map says.
- The cost of calendar days: a line cleared at 11:58pm is due two minutes later, at midnight. That is the same day boundary flash-card apps use, and it only shortens the first, 1-day gap.
- Readiness still starts sliding at the due timestamp, not at midnight. The gap is under a day, and readiness is a smooth score, so it was left alone.
