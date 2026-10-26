# 0009. Day-to-day work happens in Claude Code, and the repo carries the context

Status: Accepted (2026-10-17). Amended by [0011](0011-branches-for-features.md): features now go on a branch.

## Context

Express & Local was built in long chat sessions. The context (what's done, what's next, the content rules, the traps, how to check claims) lived in those chats and got lost or compressed when they ended. Snippr, Ryan's other project, already moved to Claude Code in the terminal, inside the repo, and it works.

## Options

1. **Keep working in long chats.** Familiar, but every new chat starts by rebuilding context, and details get dropped.
2. **Claude Code in the repo, with the context written down.** `CLAUDE.md` loads automatically every session; the docs hold the rest. Sessions can be cleared between tasks without losing anything.

## Decision

Option 2, on the same terms as Snippr:

- Ryan owns the project and makes the calls. Claude is the senior engineer, writes the code and content, and explains the work in plain English.
- Commit, never push. Small Conventional Commits on local `main`; Ryan reviews with `git log origin/main..HEAD` and `git show`, and pushes himself.
- The repo carries the context: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md` and this folder.
- `/next` (`.claude/skills/next/SKILL.md`) picks up the next roadmap item, plans it, builds it with checks, keeps the docs true, commits, and reports back. `/next learn` sets up the work but leaves the core piece for Ryan.
- A `fact-checker` agent (`.claude/agents/fact-checker.md`) does the independent content review.

## Consequences

- Anything learned in a session that a future session would need goes into the docs, or it is lost.
- The roadmap is the source of truth for what's next. `/next` works from its top.
- `ROADMAP.md` moved from the repo root to `docs/ROADMAP.md`.
