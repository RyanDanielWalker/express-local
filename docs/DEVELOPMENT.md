# Development

Setup, scripts, how we work together, and how content gets checked.

## Setup

Requires Node.js 22.12+ for the app (Vitest 5 needs it) and 22.22.2+ or 24.15+ for the React probes (jsdom needs it). `.nvmrc` pins 22, so `nvm use` picks it up.

```bash
npm install
npm run dev          # http://localhost:5173
```

To check content against real code, also install the probes once (see [probes/README.md](../probes/README.md)):

```bash
(cd probes/react && npm install) && (cd probes/nest && npm install) && (cd probes/ts && npm install)
```

The app is not deployed. It runs locally.

## Scripts

| Command             | What it does                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                                                                                |
| `npm test`          | Every test: algorithms, engine, content, the bar, the results screen. Run before every commit.            |
| `npm run typecheck` | `tsc --noEmit` over `src`                                                                                 |
| `npm run build`     | Typecheck, then a production build into `dist/`                                                           |
| `npm run preview`   | Serve the production build locally                                                                        |
| `npm run bar`       | Where every line stands against the quality bar, division by division                                     |
| `npm run lint`      | ESLint: the recommended JavaScript and TypeScript rules, the React hooks rules. Run before every commit.  |
| `npm run format`    | Prettier on its default settings. `npm run format:check` only reports. Run the check before every commit. |

Both skip `probes/`. Those are sandboxes with their own packages, and some depend on exact line placement, like a `@ts-expect-error` on the line above an error.

So that `git blame` skips commits that only reformat, run this once:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

A future reformatting commit gets its full hash added to that file, and its branch is merged with a merge commit. Squashing or rebasing gives the commit a new hash, and the file would point at nothing.

Use these scripts rather than calling the tools directly. `tsc -b`, for example, writes a `tsconfig.tsbuildinfo` file the repo does not want.

## CI

Every push and pull request runs `.github/workflows/ci.yml` on GitHub Actions, on the Node version in `.nvmrc` ([ADR 0013](adr/0013-ci-on-github-actions.md)). It runs these steps in order and stops at the first failure:

1. `npm ci`, here and in `probes/ts`
2. `npm run format:check`
3. `npm run lint`
4. `npm run typecheck`
5. `npm test`, which includes the bar
6. `npm run check` in `probes/ts`
7. `npm run build`
8. `npm audit --omit=dev`, which reports but never fails the run

To reproduce a red run, run the same step locally. The React and Nest probes are not in CI. Run them by hand when content changes.

The actions are pinned to a commit hash, with the release beside it in a comment. To bump one, find the new release's commit (`gh api repos/actions/checkout/commits/<tag> --jq .sha`) and change the hash and the comment together.

## Working agreement

Ryan owns the project and makes the calls. Claude is the senior engineer: it writes the code and the content, and explaining the work is part of the job.

- **Commit, never push.** Work happens in small commits as the work goes, not one big commit at the end. Ryan reviews with `git log origin/main..HEAD` and `git show <sha>`, then pushes himself. Never push, and never rewrite a commit that has been pushed.
- **No co-author trailer.** `.claude/settings.json` turns off Claude Code's commit and pull request attribution. The README's **How this was built** section and each pull request's **Who wrote what** line carry the disclosure instead ([ADR 0012](adr/0012-disclose-ai-in-the-readme.md)). If Ryan writes a piece himself (a `/next learn` item), add it to that README section.
- **Features on a branch, small fixes on `main`** ([ADR 0011](adr/0011-branches-for-features.md)). A roadmap item (a feature, a content block, a refactor, anything risky) gets a branch named for it, like `feat/router` or `content/near-duplicates`. Ryan pushes the branch, opens a pull request from the template in `.github/`, and merges when CI is green. A docs fix, a wording tweak, moving a button or some padding goes straight to `main`. When unsure, branch.
- **Conventional Commits.** `feat:`, `fix:`, `content:`, `docs:`, `chore:`, `test:`, `refactor:`, and `style:` for a commit that only reformats, with an optional scope like `fix(react):`. The subject says what changed. The body says why, in plain sentences.
- **Content commits say what they were checked against.** The body ends with a `Checked against:` line naming the docs page (as a URL path) and the probe that proved it, for example: `Checked against: react.dev/reference/react/useActionState; probes/react/forms.tsx.`
- **Stop for real decisions.** Anything about scope, product direction, or a tradeoff Ryan would care about gets two or three options and a recommendation before work starts. Routine choices get made, then mentioned in the report.
- **Plain English.** Explanations to Ryan follow the same clarity standard as the content: one idea per sentence, the example before the name, every term defined.
- **Keep the docs true.** A change that makes `README.md`, `CLAUDE.md`, or anything in `docs/` untrue fixes it in the same commit. A significant decision gets an ADR in `docs/adr/`.
- **No loose threads.** A roadmap item is done when everything it touched is done, verified and documented. Anything found along the way that isn't getting fixed now goes on the roadmap, not into a mental note.

A commit message looks like this:

```
content: replace two React questions that repeated others

Fare Machine asked for the type of a number input's value, which
Typed Components already asks. It now asks how to start a <select> on
an option.

Checked against: react.dev/reference/react-dom/components/select;
probes/react/select.tsx (defaultValue starts it), select3.tsx (value
without onChange is stuck and warns), select2.tsx (selected on an
option works but warns, checked does nothing).
```

## Checking content

Ryan is still learning this material, so he cannot catch a wrong claim in review. Every claim has to be right before it is committed. The docs are where a claim starts. Running code is where it gets proven. See [ADR 0006](adr/0006-prove-claims-by-running-them.md) for why.

For every new or changed question, option, explanation, puzzle card, flow step, note and field guide example:

1. **Read the official docs** for the current version: [nestjs.com](https://docs.nestjs.com), [typescriptlang.org](https://www.typescriptlang.org/docs/), [react.dev](https://react.dev). Note the page.
2. **Prove it in `probes/`.** TypeScript claims compile under 5.9, 6.0 and 7.0 with `strict` on. React claims render with react-dom 19.3 in jsdom, in development and, when StrictMode, warnings or timing could matter, production. NestJS claims run as a small Nest 12.1.3 app on the Express adapter, hit with supertest. Details are in [probes/README.md](../probes/README.md).
3. **Prove the wrong options wrong.** A distractor that a knowledgeable person could defend is a bug.
4. **Make the probe able to fail.** Add one check that should fail and confirm it does.
5. **Say which version or setting** a claim depends on, in the content itself ("since React 19.2", "on the default Express adapter", "with `strict` on").
6. **Search for duplicates.** If another question in any line already tests the same fact with the same answer, take a different angle.
7. **Re-prove after any edit**, including rebalancing option lengths.
8. **Run `npm test` and `npm run bar`.**

When a block of content work is done, and always before an inventory stop:

9. **A separate agent fact-checks it.** The `fact-checker` agent (`.claude/agents/fact-checker.md`) did not write the content, so it isn't grading its own work. It writes probes only in a `_review/` folder inside the probe folders, and reports findings.
10. **Verify each finding** by re-running its probe before changing anything. Reviewers are sometimes wrong too.
11. **A fresh agent re-checks the fixes.** Fixes have introduced new errors before.

## Editing content files

The data files are large TypeScript files of strings.

- Run `npm run format` after editing. Prettier picks whichever quote needs fewer escapes, so `"don't"` needs none. ESLint flags a needless `\'`. When a script writes the file, double-check it didn't escape twice (`\\'`), which has broken the file before.
- A question's answer appears twice: once in `opts` and again in `a`. Change both, or the test that checks the answer is an option fails.
- Rewording a question's `q` or `code` resets the player's history for that question (see [ARCHITECTURE.md](ARCHITECTURE.md#a-question)). That's fine, just know it.
- Sort card names cannot contain the first word of their own box, and cannot contain backticks.
- No em dashes anywhere in player-facing copy. A test enforces it.

## Checking the app

For any change a player would see, run it and look:

```bash
npm run build && npm run preview
```

Play the changed line on Local at least twice (the last-stop puzzle rotates), check the field guide, and watch the browser console for errors or warnings. For layout changes, check a phone-width window in light and dark.

If the session has a browser tool, Claude plays it. If not, Claude lists the exact steps for Ryan (which line, which tier, what to look for), and the report marks it as not yet checked in a browser.

## Inventory stops

The roadmap has inventory stops between blocks of work. Each stop ends with a commit whose subject starts with `docs: inventory stop`, so the next one can find it. "Everything since the last stop" means:

```bash
git log -1 --format=%h --grep '^docs: inventory stop'      # the last stop
git diff <that sha>..HEAD -- src/data/                     # what changed since
```

The roadmap's status line names the last stop's commit until the first one made this way exists. At each stop:

1. The fact-check pass above, over everything changed since the last stop.
2. `npm test`, `npm run lint`, `npm run format:check`, `npm run bar`, `npm run build`, and the probes (see "What counts as passing" in [probes/README.md](../probes/README.md)): `npm run check` in `probes/ts`, and every React and Nest probe that backs changed content.
3. Play every changed line in a browser.
4. Read `README.md`, `CLAUDE.md` and everything in `docs/` against the code. Every number and claim must still be true.
5. `git status` clean, nothing stray (build caches, scratch files) left in the repo.
