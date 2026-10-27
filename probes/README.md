# Probes

Small sandboxes that prove the app's content is true. They are not part of the app: nothing here is built, bundled or run by `npm test`. Each folder has its own `package.json` and `node_modules`.

The rule they serve is in [CLAUDE.md](../CLAUDE.md): the docs are where a claim starts, and running code is where it gets proven. Reviews kept finding claims the docs seemed to support that the real code did not, like React stopping an effect loop (it only warns) or `@HttpCode()` being ignored next to `@Res()` (it still applies).

## Setup

Node 22.22.2+ or 24.15+ (jsdom needs it).

```bash
cd probes/react && npm install
cd ../nest && npm install
cd ../ts && npm install
```

Versions are pinned to what the content claims to cover. When the content moves to a new version, bump the pin here, re-run every probe in that folder, and fix the content wherever the result changed. Adding a pinned package a probe needs (like `@nestjs/throttler`) is routine; adding one to the app itself is not.

## What counts as passing

| Folder | A healthy result |
|---|---|
| `react/` | Every check prints `PASS` except exactly one: `FAIL SANITY should fail`. So the last line reads `fails 1`. |
| `nest/` | The same, for probes that use `ok()` (the `example/` template, `auth/jwt-clarity.ts`, `gaps/p1.ts`, `dupes/n.ts`). |
| `ts/` | `npm run check` ends with `all as expected`. CI runs it on every push. |

Some older probes are **observation probes**: they print what happened (statuses, render counts, effect logs) without `ok()` checks, and the content was checked by reading that output. They are kept as evidence. Re-run one and compare its output with the claim it backs. Every new probe uses `ok()` and a SANITY line.

## Review work

Scratch work, including the `fact-checker` agent's, goes in a `_review/<name>/` folder inside the matching probe folder: `probes/react/_review/...`, `probes/nest/_review/...` or `probes/ts/_review/...`. Git ignores every `_review/` folder. Living inside the probe folder means it uses that folder's pinned packages.

## react/

React 19.3 and react-dom rendered into jsdom.

```bash
cd probes/react
npm run probe -- forms.tsx         # development build
npm run probe:prod -- prod.tsx     # production build
```

`harness.ts` sets up jsdom (including `FormData` and `Event`) and gives you `ok(condition, message)` and `done()`, which prints the count and exits. Import it first: `import { ok, done } from './harness.ts'` (from `_review/<name>/`, use `'../../harness.ts'`). If you don't use `ok` or `done`, write `import './harness.ts'`, because esbuild drops unused imports.

- Render with `createRoot` inside `act()`. Count renders, log effect setups and cleanups, and use a `MutationObserver` when a claim is about what React touches in the DOM.
- `act()` only exists in development builds. A production probe renders without it and waits on a short timeout instead. See `prod.tsx`.
- Submit a form with `button.click()`, the way a user would.
- A Suspense boundary that hides content keeps it in the DOM with `display: none`. So `textContent` includes the hidden content. Check the style, not just the text.
- Run anything about StrictMode, warnings or timing in both development and production.

Files are named for the line or topic they prove: `render`, `render2`, `effect`, `effect2`, `effect-types`, `state`, `lists`, `perf`, `perf2` (a custom memo compare, and `<Profiler>` in production; run it in both builds), `render3`, `render4` (a setter called from a child, an inline context value, and `onClick={setCount(...)}`; run it in both builds), `state2` (a prop copied into state), `hooks`, `hooks2` (a custom hook's state belongs to its caller), `forms`, `forms2`, `data`, `data2`, `gaps1` (`useEffectEvent` and `<Activity>`), `select`, `select2`, `select3`, `snippets` (the field guide code), and `prod` (production-build behavior).

## nest/

NestJS 12.1.3 on the Express adapter, plus GraphQL (Apollo), JWT and Passport, the throttler, and config.

```bash
cd probes/nest
npm run probe -- example smoke     # compiles example/ and runs example/smoke.ts
```

Each probe is a folder with a `tsconfig.json` that extends `../tsconfig.base.json`. `run.mjs` compiles the folder to `dist/` and runs the file you name. To start a new probe, copy `example/`: `smoke.ts` is a complete template with `ok()`, `done()` and a SANITY line. Build each claim as a small module with `Test.createTestingModule`, hit it with supertest, and check what actually happens: the status, the body, and which hooks and filters ran. In `_review/<name>/`, change `extends` to `../../tsconfig.base.json` and run `npm run probe -- _review/<name> <file>`.

Folders: `example`, `life` (request lifecycle), `di`, `route`, `dto`, `err`, `auth` (including the JWT and Passport probes from the reviews, `jwt-*.ts`), `test`, `gaps` (dynamic modules, decorators, GraphQL guards, shutdown hooks), and `dupes` (the questions that replaced the last cross-line near-duplicates: an un-awaited rejection, `ParseArrayPipe`, and where an `APP_GUARD` applies; `n.ts` runs `crash-app.ts` as a child process, because the claim is that the process dies). Shutdown hooks need a real process and real signals:

```bash
npx tsc -p gaps && node gaps/sdrun.mjs
```

## ts/

TypeScript 5.9 (what the app builds with), 6.0 and 7.0, side by side.

```bash
cd probes/ts
npm run check                    # every folder, every version
npm run check -- narrow          # one folder
npm run check -- _review/mine    # any folder path
```

Write each claim as code with a type assertion:

```ts
type Expect<T, U> = [T] extends [U] ? ([U] extends [T] ? true : false) : false;
const t: Expect<typeof value, string[]> = true;   // fails to compile if the claim is wrong
```

Use `// @ts-expect-error` where something should be an error. The runner judges each config by its name:

- `tsconfig.json`, and any other `tsconfig.*.json`, must compile cleanly.
- `tsconfig.neg*.json` must fail with a real type error. It holds a deliberately wrong assertion (proving the probe can fail), or code that is supposed to be an error. A missing file or a broken config does not count.
- `tsconfig.reveal*.json` exists to make `tsc` print an inferred type in an error message. Its output is shown, not judged.

Folders match the lines: `narrow`, `generics`, `utility`, `unknown`, `shapes`, `reactts`, and `gaps` (the questions added after the review).

## Rules for every probe

1. Prove the wrong options are wrong, not just that the right one is right. A wrong option someone could defend is a bug.
2. Add one check that should fail, and confirm it does. A probe that cannot fail proves nothing. In React and Nest probes, that's `ok(false, 'SANITY should fail')`; in TypeScript, a `neg` config.
3. Re-run whatever an edit touches, including length rebalancing. Rebalancing once turned a wrong option into a true one.
4. Keep the probes that prove committed content, in the folder for their line, and cite them in the commit body.
