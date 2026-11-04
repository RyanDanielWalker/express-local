# 0029. Due dates sit at noon, and a due date no ride could set is due now

Status: Accepted (2026-11-04). Amends [ADR 0027](0027-early-rides-and-calendar-days.md).

## Context

The third audit ([audits/2026-11-04.md](../audits/2026-11-04.md)) re-checked the early-ride fix and found date bugs next to it. Each was re-run against the real code before fixing:

1. **A clock change at 3am.** `addDays()` kept the clock time. In Helsinki the clocks jump from 3am to 4am one night each spring. A ride at 3:30am the night before gets a due time of 3:30am, which does not exist, so the browser moves it to 4:30am. That is the next app day, so the review lands a day late. Going back a day for the streak had the same problem, so a streak could reset. ADR 0027 said a daylight saving change "cannot skip or repeat a day". That was true in New York, where the clocks change at 2am, and false here.
2. **A due date in the far future.** Since ADR 0027, only a due ride rewrites the due date. A due date in 2030, from a wrong device clock or an edited save code, made every ride early until 2030. A due date past what a JavaScript `Date` can hold made every day count `NaN`, readiness included.
3. **A stale Daily Ride.** The pick only changed when the app loaded or a ride ended. In a tab left open past 4am, the Today band kept showing yesterday's pick, and riding it paid no bonus.
4. **Small ones.** The intro said "Last done 1 days ago", and "0 days ago" the morning after an evening rehearsal. Clearing Local and then Express in one sitting said the Express ride "was early".

## Decision

Ryan asked for all of them fixed, and left the details to Claude.

- **Due dates sit at noon.** `addDays()` now returns noon on the app day `n` days later. No clock change skips noon. Nothing read the clock time of a due date anyway: `isDue()`, readiness and the day counts only read the day. The tests now check every day of a year in New York, Helsinki, Lord Howe (a 30-minute change) and Santiago (a change at midnight).
- **A due date no ride could set is due now.** A ride sets the due date at most one box gap ahead. So `isDue()` treats a due date further off than its box's gap as due now, and the next ride repairs it. `migrate()` turns a due date no `Date` can hold into 0, which is also due now.
- **The Daily Ride turns over at 4am.** `dailyIndex()` returns nothing for a pick from an earlier day, so a stale pick is never offered. `App.tsx` picks again a second after the next 4am, and whenever the tab comes back into view, since a hidden tab's timer can fire late.
- **The intro counts app days.** `daysAgo()` says "today", "yesterday" or "3 days ago".
- **A ride that climbs a tier is not called early.** It still does not count as a review, and the due date stays where it was. But it is progress on the line, not a repeat, so the results screen shows the usual "Next review in N days".

## Consequences

- No save field. A save's old due dates keep their clock time, and they still read the same, since only the day is read.
- A damaged due date costs at most one ride to repair, and the line shows as due on the map until then. Readiness does not treat it as late, so the two can disagree for a damaged save.
- The first end-to-end test starts the browser's clock at noon. Its second ride has to be early, and before this, two rides either side of 4am failed it.
- The Daily Ride check runs in the browser, in `App.tsx`, which has no unit tests. The rule itself is tested in the engine, and the turnover was checked in Chromium with Playwright's clock.
