# 0015. A damaged save is repaired field by field, not rejected

Status: Accepted (2026-10-26).

## Context

Two things feed a save into the app: `localStorage` when it starts, and a save code pasted into Restore. Neither can be trusted. A code can be cut short, edited by hand, or come from an older or newer build. `migrate()` used to copy every key it found into the save. A wrong type could get through and break the app later: a Daily Ride pick that was a string made `migrate()` throw, which made a slightly damaged save in this browser load as an empty one, wiping the player's progress. A Leitner box of 99 showed readiness as `NaN`. A `best` that was a string crashed the end of a ride.

## Options

1. **Repair.** Check every field. A field of the wrong type gets its default, an entry that can't be read is dropped, and keys a save doesn't have are left out. Whatever is good survives.
2. **Reject.** Refuse the whole save if any field is wrong. Simple to explain, but one bad field costs all the progress, and on load there is nobody to tell.
3. **A schema library** such as Zod. Less code, but a dependency in the app for one function, and the roadmap asked for hand-written checks so the reasoning is visible.

## Decision

Option 1, by hand, in `migrate()`. `importSave()` still refuses a code with no readable line progress at all (`levels` missing or not an object), because then there is nothing worth importing, and it says so. Line progress for a line id the app doesn't know is kept, so nothing is thrown away that a renamed or future line might still need.

## Consequences

- `migrate()` can no longer throw on parsed JSON, so loading never falls back to an empty save because of one bad field.
- `migrate()` lists every field it keeps. A new save field that is not added there is silently dropped on the next load. The "keeps every field of a good save" test catches it only if the new field is set by the steps that test runs.
- The player confirms a restore with the incoming XP shown, so a heavily repaired code is visible before it replaces anything.
