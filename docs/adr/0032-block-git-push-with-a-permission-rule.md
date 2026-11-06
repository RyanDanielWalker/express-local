# 0032. Stop Claude from pushing with a permission rule

Status: Accepted (2026-11-06).

## Context

CI deploys on every green push to `main`, and Ryan's review before pushing is the safety check. "Commit, never push" lived only in `CLAUDE.md`. Claude Code's docs say `CLAUDE.md` is context, not enforcement. Claude reads it and usually follows it, but nothing stops a command that breaks it.

Every command also went through the permission prompt, including ones that can't change anything, like `git status` and `npm test`.

Two terms matter here. A deny rule refuses a matching command before it runs, whatever Claude decides. An allow rule runs a matching command without asking. For example, `Bash(git push *)` under `deny` refuses `git push origin main`, and `Bash(npm test *)` under `allow` runs `npm test` with no prompt.

## Options

1. **Leave it as an instruction.** Nothing to maintain. But one bad decision reaches the live site, and the review step is skipped by the same mistake it was meant to catch.
2. **Permission rules in `.claude/settings.json`.** A few lines, committed, in a file this project already has. They match the command's text, so a push hidden inside a script wouldn't match.
3. **A hook, a script that inspects each command before it runs.** It could catch more spellings. But it's code to write and test for a rule that a few lines of settings already cover.

## Decision

Option 2.

- **Denied:** `git push`, including `git -C <folder> push`.
- **Allowed without asking:** read-only git commands (`status`, `log`, `diff`, `show`, `ls-files`, and `branch --show-current`) and the checks (`npm test`, `typecheck`, `lint`, `format:check`, `bar`, `build`).
- **Still asks:** everything else, including `git commit`. Ryan can loosen that later if the prompts get in the way.
- **The session link trailer is off** (`attribution.sessionUrl: false`). [ADR 0012](0012-disclose-ai-in-the-readme.md) already turned off the commit and pull request attribution. This setting closes the last one, a link added to commits made from web or Remote Control sessions.

## Consequences

- A mistaken push from Claude is refused before it reaches the live site. Routine checks run without stopping to ask.
- The rules only bind Claude. Ryan pushes from his own terminal exactly as before.
- They match command text, so they are a strong guardrail, not a sealed wall. A script that runs `git push` inside it would get through. Reviewing before pushing is still the real check.
- The allowlist runs project code without asking, since `npm test` and `npm run build` execute what's in the repo. That's the same code Ryan reviews before pushing.
- Snippr has the same rules, with the same reasoning, in its own ADR 0034. It also refuses reads of `.env`. This project has no secrets on disk, so it doesn't need that.
