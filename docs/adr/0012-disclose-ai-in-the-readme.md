# 0012. AI use is disclosed in the README, not in commit trailers

Status: Accepted (2026-10-26).

## Context

Every commit up to `c1e7326` ends with a `Co-Authored-By: Claude` trailer and a session link, which Claude Code adds by default. Snippr, Ryan's other project, settled on a different approach: Ryan is the author of every commit, because a commit's author means "I am responsible for this," and he reviews and pushes all of it. The AI disclosure lives in the README instead, where a reader actually looks. Ryan wants his projects to work the same way.

## Options

1. **Keep the trailers.** The history stays consistent, and the disclosure is in every commit. But it is scattered across hundreds of commits nobody reads, and it does not say how the work was done.
2. **Stop the trailers from here on, and disclose in the README.** Matches Snippr. The history changes partway through, so this ADR records when and why.
3. **Rewrite history to remove the old trailers.** Consistent, but it needs a force push, and it looks like hiding something.

## Decision

Option 2. `.claude/settings.json` turns off Claude Code's commit and pull request attribution. The README's **How this was built** section says plainly how the work was split: Ryan set the direction and made the calls recorded in these ADRs, Claude wrote code and content under the rules in `CLAUDE.md`, every content claim was proven in `probes/`, and Ryan reviewed every commit before pushing it. The commits before the switch keep their trailers.

## Consequences

- The README section has to stay true. It names the parts Ryan wrote by hand as they happen (`/next learn` items), since the history alone cannot show them.
- Every pull request description has a one-line **Who wrote what**.
- If anyone asks, the answer is yes, straight away: "I used Claude like a pair programmer under rules I wrote, and I can walk you through any commit."
- A reader of `git log` sees trailers stop at `c1e7326`. This ADR is the reason.
