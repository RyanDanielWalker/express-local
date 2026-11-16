# 0033. Correct the record on the 2026-11-06 app sessions

Status: Accepted (2026-11-16). Amends [0012](0012-disclose-ai-in-the-readme.md). Corrects [0030](0030-docs-to-learn-from.md) and [0031](0031-reviews-named-for-who-ran-them.md) without changing what they decided.

## Context

On 2026-11-06, Claude sessions in the Claude app made four commits here: `2c8f3ac`, `b2a0fad`, `7204371` and `9fe5e6a`. None touched application code. They changed docs, the two skills, the `fact-checker` agent and `.claude/settings.json`. Ryan reviewed and pushed all four himself.

Those sessions wrote some things down as Ryan's decisions that he had not made at the time:

1. **`2c8f3ac` says "Ryan updated his learning rules on 2026-11-06."** ADR 0030 goes further. It lists three rules "in his words". Those lines came from a global `CLAUDE.md` that an app session drafted from its memory of him. Ryan had not adopted that file yet. He has since adopted it, and its **Learning** section now says nearly word for word what ADR 0030 quotes.
2. **ADR 0031 says "Ryan's global rules now say he learns by building with Claude, reading the docs and studying on his own."** The same draft is the source. It was not true on the day. It is true now.

The one thing from that day Ryan is sure was his call is retiring Snippr's learn mode and its 1.0 freeze. ADR 0031 mentions that, and it stands.

Snippr, Ryan's other project, went through the same review in its own ADR 0035. There, a session had also added a README section called "How this was built", which Ryan rejected. This repo has a section with the same name. It did not come from the app sessions. It dates from [ADR 0012](0012-disclose-ai-in-the-readme.md) on 2026-10-26, when Claude Code's commit trailer was turned off and the credit for Claude moved to the README. A _commit trailer_ is a line at the end of a commit message that tools read as data, like `Co-Authored-By: Claude <noreply@anthropic.com>`. GitHub shows a commit with that line as having two authors. Because the two projects had diverged, Claude asked Ryan about this section instead of following Snippr.

## Options

For the four commits:

1. **Rewrite history to remove them.** It needs a force push to a public, deployed `main`, it hides the mistake, and it throws away accurate fixes.
2. **Revert the parts Ryan can't confirm.** But each change is one he now agrees with. Reverting them only to reapply them would be churn.
3. **Keep all four, and write down what was attributed to him wrongly.** One record. The history stays honest, including the mistake.

For the README's **How this was built** section:

1. **Keep it as written.** It says how the work was split, in the place a visitor reads first.
2. **Shrink it to the credit itself,** the way Snippr's ADR 0054 did: built with Claude Code, plus why older commits name Claude and newer ones do not. The case study keeps the long story.
3. **Remove it.** Then nothing visible would credit Claude on commits after `c1e7326`, and the co-author trailer would have to come back.

## Decision

Claude recommended option 3 for the commits, and Ryan chose it. All four stay.

For the README, Claude recommended keeping the section. Ryan chose option 2. It now reads:

> Express & Local is built with Claude Code. Commits up to `c1e7326` name Claude as a co-author. Later ones don't, because this section says it once.

The heading stays, so item 3 of the 1.0 list on the roadmap is still met as written.

Ryan also chose, when Claude asked, to keep `/next learn` and `/audit quiz` as opt-ins. They only run when he types them. ADR 0030 had already kept them, but a session made that call. It is now Ryan's.

## Consequences

- **Read ADR 0030 with this correction.** The three lines "in his words" were drafted by a session, not said by Ryan. He adopted them later. The rules themselves stand.
- **Read ADR 0031 with this correction.** "Ryan's global rules now say..." was not true on 2026-11-06. It is true now. Its line that the README section "says plainly that these reviews were Claude's" no longer holds. The README's 1.0 checklist and the case study still say so.
- **Read ADR 0012 with this change.** The README section no longer describes how the work was split. The case study's **How Ryan worked with Claude** does that.
- **A piece Ryan writes himself** (a `/next learn` item) is now named in the case study's **How Ryan worked with Claude**, not in the README. ADR 0012 and [ADR 0018](0018-learn-mode-after-1-0.md) pointed at the README for that. `docs/DEVELOPMENT.md` and the `/audit` skill now point at the case study.
- **The README says less.** A visitor learns that Claude built it, but must open the case study to learn that Ryan made the calls and reviewed every commit.
- **The misattributed commit messages stay in the public history.** That is the cost of not rewriting it.
- **The rule from here on:** a session records something as Ryan's decision only if he made it in that session or it is already in the repo. A session never quotes him unless he actually said it. If it is inferring, it asks first.
