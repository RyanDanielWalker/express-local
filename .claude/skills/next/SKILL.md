---
name: next
description: Pick up the next Express & Local roadmap item, plan it, build or write it with proof, keep the docs true, commit small, and report back without pushing. "/next learn" sets the work up and leaves the core piece for Ryan.
argument-hint: "[learn]"
disable-model-invocation: true
---

# /next

Ryan owns this project and makes the calls. You are the senior engineer. You do the work, prove it, commit it, and explain it in plain English. You never push.

Argument: `$ARGUMENTS`

- Empty: normal mode. Do the next item completely.
- `learn`: learn mode. Set the item up, but leave the core piece for Ryan (see **Learn mode** at the bottom).
- Anything else: treat it as the item Ryan wants instead of the top of the roadmap, if it matches one. If it doesn't, ask.

## 1. Get your bearings

1. Read `docs/ROADMAP.md`. `CLAUDE.md` is already loaded. Read `docs/ARCHITECTURE.md` and `docs/DEVELOPMENT.md` if the item touches what they cover.
2. **Coming back from learn mode?** Run `grep -rn "TODO(ryan)" src probes --include=*.ts --include=*.tsx`. If it finds anything, Ryan is handing work back: skip the dirty-tree and failing-test rules below and go to **Reviewing Ryan's work** at the bottom.
3. Run `git status` and `git log --oneline origin/main..HEAD`.
   - If the tree is dirty, stop and tell Ryan what's there. Don't build on top of changes you don't understand.
   - If there are unpushed commits, they're waiting for Ryan's review. Mention them in your report. Don't amend them.
4. Run `npm test`. If anything fails before you've changed anything, that is the first job: report it and fix it before the roadmap item.

## 2. Pick the item

Take the first unchecked item under **Next, in order** in `docs/ROADMAP.md`. If it's a group of small checkboxes (like the near-duplicate pairs), take as many as fit in one sitting of a few small commits, starting from the top. Never skip ahead past an inventory stop.

## 3. Plan, and stop if there's a real decision

Write a short plan: what you'll change, which files, how you'll prove it, and what "done" means for this item.

Stop and ask Ryan (with two or three options, your recommendation first) when the item needs a call that is his to make: product direction, scope, anything a player would notice that the roadmap doesn't already decide, a dependency added to the app, or a tradeoff between two reasonable approaches. Don't ask about routine choices. Make them and list them in the report. Pinning a package in a `probes/` folder so a claim can be proven is routine.

Then create the item's branch from an up-to-date `main` (`git switch -c feat/<item>` or `content/<item>`), unless it is a small fix or an inventory stop, which go on `main` (see `docs/DEVELOPMENT.md`, "Working agreement").

Then decide which loop the item needs. Most items are content.

## 4a. The content loop

For each question, option, explanation, puzzle, note or field guide example you add or change:

1. **Read the official docs** for the version the app covers (react.dev, docs.nestjs.com, typescriptlang.org). Note the page.
2. **Search for duplicates.** Grep all three data files for the same fact. If another question already tests it with the same answer, take a different angle.
3. **Prove it in `probes/`.** React: render it with react-dom 19.3 in jsdom (`probes/react`), in production too if StrictMode, warnings or timing matter. NestJS: a small app with `Test.createTestingModule` and supertest (`probes/nest`). TypeScript: `Expect<A, B>` assertions under 5.9, 6.0 and 7.0 (`probes/ts`, `npm run check`). Prove every wrong option wrong, and include one check that should fail. Keep the probe; it is part of the commit.
4. **Write it to the clarity standard** in `CLAUDE.md`. One idea per sentence. Example first, then the name. Every term defined. The `why` says why the right answer is right and the tempting one is wrong. Name the version or setting if the behavior depends on it.
5. **Balance the options.** Three parallel claims. Then run `npm test` and `npm run bar`. If an answer gives itself away by length, rewrite the options. Don't pad the wrong ones. Re-prove anything you reworded.
6. **Commit per line or per small group.** `content:` for new or replaced material, `fix(<division>):` for corrections. The body says why, and ends with what it was checked against:

   ```
   Checked against: react.dev/reference/react/useActionState;
   probes/react/forms.tsx (pending order, reset after success).
   ```

A line isn't done until it clears the bar and every claim on it is proven.

## 4b. The code loop

1. **Tests first, or alongside.** Pure logic goes in `src/engine/` or `src/algorithms/` with tests, not in components.
2. **Break it on purpose once.** After the tests pass, change the code so it is wrong in the way the tests are meant to catch, confirm they fail, then put it back. Say in the report what you broke and which test caught it. A test that can't fail proves nothing.
3. **Keep saves working.** A new save field needs a default in `emptySave()` and handling in `migrate()`.
4. **Run it.** `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`. For anything a player sees, `npm run preview` and actually play it: Local at least twice, the browser console clean, phone width and dark mode for layout changes. If you have no browser tool, write Ryan the exact steps to check (which line, which tier, what to look for) and say in the report that it is not yet checked in a browser.
5. **Commit small.** `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `style:`. Subject says what, body says why.

## 5. Keep the docs true

In the same commits as the work, not after:

- Tick the item in `docs/ROADMAP.md` and add a dated line to **Shipped**. If a count changed (lines, tests), update the roadmap's status line, the top of `CLAUDE.md`, and the README.
- `docs/ARCHITECTURE.md` if how things fit together changed.
- A new ADR in `docs/adr/` for a significant decision. ADRs are append-only; a changed decision gets a new one that amends the old.
- `README.md` if a player or reader would notice (tables, counts, features). It stays professional, with no first person.
- `CLAUDE.md` if you hit a trap the next session should know about.
- `probes/README.md` if you added a probe file or folder, or pinned a new package.
- Anything you found but are not fixing now goes on the roadmap. No loose threads, no mental notes.

## 6. Review your own work as a skeptic

1. Read the full diff (`git diff origin/main...HEAD`) as if someone else wrote it and you expect it to be wrong.
2. For content: run the `fact-checker` agent on what you changed. It didn't write it, so it isn't grading its own work. Verify each finding by re-running its probe before you change anything. Fix what's real, then have a fresh `fact-checker` re-check only the fields the fixes touched.
3. If the item is an **inventory stop**, do the whole procedure in `docs/DEVELOPMENT.md` under "Inventory stops", and end it with a commit whose subject starts with `docs: inventory stop` so the next stop can find it.
4. Final checks: `npm test`, `npm run lint`, `npm run format:check`, `npm run bar`, `npm run build`, `git status` clean, nothing stray left in the repo (build caches, scratch files outside the `_review/` folders in `probes/`).

## 7. Report, then stop

Tell Ryan, in plain English and briefly:

- **What shipped:** the commits, one line each.
- **Read this one closely:** the commit most worth his review, and why.
- **Decisions I made for you:** anything routine you decided without asking.
- **How it was checked:** the docs and probes behind the content, what the fact-checker found and what changed because of it, and anything you could not verify.
- **One concept, simply:** one idea from this work, explained the way you'd explain it to a smart friend who's new to it, with a small example. Pick something he'd be asked about in an interview.
- **Pull request:** on a branch, the branch name and a draft description filled in from `.github/pull_request_template.md`, including the **Who wrote what** line, ready for Ryan to paste.
- **Next up:** what `/next` would pick up next time.

Then stop. Don't push, and don't start the next item.

## Learn mode (`/next learn`)

Ryan wants to build the core piece himself.

**For a code item:** do everything except the heart of it. Set up the types, wiring, UI and docs, and write the tests for the core piece so they fail. Leave the core as a `TODO(ryan):` with a short hint of what it needs to do (not how). Commit that as `chore: scaffold <thing> for Ryan to implement`, with the body explaining what the tests expect. Run the tests to show exactly which fail. In the report, explain the concept he'll need, point to the files, and tell him to run `/next` again when he's done, so you can review his code, then finish the docs and commit.

**For a content item:** set up a probe in the matching `probes/` folder with the scenario in place and `// TODO(ryan): predict what this logs, then run it` at the key spots, plus a `// TODO(ryan): draft the question` block at the bottom with the line it belongs to. Don't write the question yet. Commit it as `chore: scaffold a probe on <topic> for Ryan`. In the report, explain the concept, the official docs page to read, and the command to run the probe. Ryan writes his prediction and draft question into those TODO comments, then runs `/next` again.

In learn mode, never leave the repo with failing tests on `main` without saying so loudly in the report. The scaffold commit is the only one allowed to have failing tests, and only for the `TODO(ryan)` piece.

## Reviewing Ryan's work

When `/next` finds a `TODO(ryan)` marker:

1. Look at what Ryan changed (`git status`, `git diff`, and any commits since the scaffold). Don't touch his code yet.
2. Run the tests. If they pass, review his code like a kind, honest senior: what's good, what's wrong or risky, and why. If they fail, explain what the failing test is telling him, with a hint, and stop. Don't write the fix for him unless he asks.
3. For a content item, compare his prediction and draft question with what the probe actually shows. Explain anything he got wrong, then polish the question to the standard, prove it, and commit it with him credited in the body.
4. Once it's right: remove the `TODO(ryan)` markers, finish the docs, and commit (Ryan's own changes in his own commit if he hasn't committed them, with a message he approves). Then report as usual and stop.
