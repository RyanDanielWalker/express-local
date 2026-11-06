# 0030. Docs are written to be learned from, and nothing is left for Ryan to fill in

Status: Accepted (2026-11-06). Changes the "Short" rule in the [ADR rules](README.md). Makes [0022](0022-nothing-waits-on-ryan-learning-the-code.md) a standing rule for every session, without changing what it decided.

## Context

On 2026-11-06 Ryan updated the learning rules he gives Claude for all of his projects. In his words:

- He learns by building with Claude, reading the docs, and studying on his own. Claude doesn't leave gaps for him to fill in, or hold work until he has written a piece himself, unless he asks for that.
- New terms are explained in plain language with an example. No compressed, jargon-heavy definitions.
- Decision records and docs are thorough and accurate, because reading them later is how he learns what was built.

The repo mostly agreed already. [ADR 0022](0022-nothing-waits-on-ryan-learning-the-code.md) took out everything that waited on him. `/next learn` and `/audit quiz` only run when he asks for them. The content rules already put the example before the name. Three things did not match:

1. **The ADR rules said "Short. A page at most."** That pushes a record toward cutting the reasoning, and the reasoning is the part Ryan reads an ADR for.
2. **Talking to Ryan was "plain English, short, no jargon without a definition."** A definition with no example is exactly the compressed kind the new rule asks to avoid.
3. **"Nothing is left for Ryan" lived only in ADR 0022**, which is about 1.0's gates. The `/next` skill's normal mode never said it. A session that read only the skill could still decide a `TODO(ryan)` was a helpful thing to leave behind.

## Options

1. **Change the wording, with no ADR.** Quick. But the ADR rule is a decision about how the project records decisions, and changing it quietly is what the append-only rule exists to stop.
2. **Write this ADR, and change the wording everywhere a session reads it.** One record of why, and `CLAUDE.md`, the working agreement and both skills all say the same thing.
3. **Also remove `/next learn` and `/audit quiz`.** Rejected for the same reason ADR 0022 gave: they only run when Ryan asks, and the new rule allows exactly that.

## Decision

Option 2.

- **Docs and ADRs are thorough, not padded.** An ADR is as long as it needs to be for someone who wasn't there to understand the decision: what forced it, each option with its real cost, what was picked, and what follows. Short is still good when nothing the reader needs gets cut. Detail that belongs to the code or the roadmap is linked, not copied.
- **A new term gets a plain definition and a small example,** in docs, ADRs, reports and explanations to Ryan. For example, not "the bar is a ratchet, a monotonic constraint", but "a ratchet only turns one way. Here, once a division is marked finished, any line in it that slips below the bar fails the tests. So finished can't quietly become unfinished."
- **Nothing is left for Ryan to fill in unless he asks.** Normal `/next` finishes the item: no `TODO(ryan)` marker, no exercise, no piece held for him to write. He asks with `/next learn`, with `/audit quiz`, or by saying so. If he says "just finish it" partway through, Claude finishes it.

## Consequences

- Changed with this ADR: the rules in `docs/adr/README.md`, **How we work** and **Voice** in `CLAUDE.md`, the **Working agreement** in `docs/DEVELOPMENT.md`, and the `/next` and `/audit` skills.
- Older ADRs keep the length they were written at, since ADRs are append-only. If one turns out too thin to learn from, the explanation goes in a new ADR or in the doc that covers that part of the app. `/audit` now flags a thin ADR the same way it flags clever code with no comment.
- Reports to Ryan stay short. Thorough is for the docs he reads later. A report leads with what he needs to know or do, and points to the doc for the rest.
- The thing to watch is thorough turning into padded. The clarity standard in `CLAUDE.md` still applies to docs: one idea per sentence, and cut any word that isn't helping.
- Tutor mode, parked for 2.0 on the roadmap, hands Ryan a scaffold with blanks on purpose. That fits this rule, because a tutoring session is something he starts. It should never be what a normal `/next` does.
