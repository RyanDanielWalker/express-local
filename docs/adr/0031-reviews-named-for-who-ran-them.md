# 0031. Reviews are named for who ran them

Status: Accepted (2026-11-06). Amends [0022](0022-nothing-waits-on-ryan-learning-the-code.md).

## Context

The README, `CLAUDE.md`, the roadmap, the case study, the `/audit` skill and the `fact-checker` agent all said the content was "independently reviewed". Independent suggests someone other than the author, and possibly someone other than Claude. In fact, every one of those reviews was run by a separate Claude agent, which had not written the content it checked. The audits were Claude too, in a fresh session.

That review is still worth doing. It found real errors: 8 wrong items in TypeScript and 55 items to fix in React. But the word claimed more than it delivered. A reader of a portfolio project could take it to mean a person checked the work, and could ask Ryan about it in an interview.

Ryan's other project, Snippr, made the same correction on 2026-11-06 for the same reason. Its README now says its audits are "reviews Claude ran in fresh sessions, not outside reviews".

Snippr also retired its learn mode that day. That dates one sentence in [ADR 0022](0022-nothing-waits-on-ryan-learning-the-code.md), which says "Snippr is the project he learns end to end". Ryan's global rules now say he learns by building with Claude, reading the docs and studying on his own, in every project. So Snippr is no longer a place where he writes pieces by hand to learn them. ADRs are append-only, so the sentence stays and this record corrects it.

## Options

1. **Leave the word.** Nothing to change. But the two projects would describe the same kind of review differently, and this one would overstate it.
2. **Say who ran the review, everywhere a reader sees the claim.** A handful of lines in the docs. Accepted ADRs keep their wording, so [ADR 0006](0006-prove-claims-by-running-them.md) still says "independent".
3. **Rewrite the ADRs too.** Every mention would match. But it breaks the append-only rule, and those records describe how the decision was understood at the time.

## Decision

Option 2.

- The docs and skills now say "separate Claude agents", or "a fresh-session review by Claude" for `/audit`.
- The `fact-checker` agent's prompt no longer calls itself independent. What matters in that prompt is the sentence that follows: it did not write the content, and its job is to try to break it.
- The README's **How this was built** section says plainly that these reviews were Claude's.

## Consequences

- A reader gets an accurate picture: proven by running code, then checked by a Claude agent that didn't write it. No person outside the project reviewed the content.
- The Oct 15 and 16 reviews are described the same way in the roadmap. The roadmap and case study call their reviewers "reviewers" and "agents", and the commits from that period are Claude sessions.
- The Prove every claim rule in `CLAUDE.md` is unchanged. Only the name of the last step changed.
- Older ADRs and audits still use the old word where they were written with it. Read "independent" there as "a separate Claude agent".
