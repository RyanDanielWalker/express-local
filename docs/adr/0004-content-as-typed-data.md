# 0004. Content is typed data in `src/data/`

Status: Accepted. Decided earlier (2026-10-06), recorded 2026-10-17.

The original discussion was not written down. The context and options below are reconstructed from the code, the README and the roadmap.

## Context

The first lines were hand-built games, each its own component. Adding the stack divisions meant hundreds of questions, puzzles and study notes. Writing a component per topic would not scale, and content scattered through components cannot be checked automatically.

## Options

1. **Components per topic.** Full control, no shared checks, slow to add.
2. **JSON or Markdown files loaded at runtime.** Easy to edit, but untyped, and a typo shows up as a broken screen instead of a failed build.
3. **Typed TypeScript objects in `src/data/`,** one file per division, merged into `LINES` and `GUIDE`.

## Decision

Typed objects. A line declares a `kind` (`game`, `quiz` or `flow`) and carries its own questions, sorts, flows and field guide. Generic components (`QuizRun`, `QuizGame`, `SortGame`, `FlowGame`) play any quiz or flow line. Only algorithm games need their own component.

## Consequences

- Adding a topic means writing data, not components. [ARCHITECTURE.md](../ARCHITECTURE.md) describes the shapes and how to add each kind of content.
- The compiler and `data.test.ts` catch structural mistakes on every `npm test`: missing fields, answers that are not among the options, duplicate ids, unsolvable puzzles, em dashes.
- The data files are long (the React file is over 2,000 lines). Edits must be careful with quoting, and a question's answer appears twice (in `opts` and `a`).
- Everything ships in one JavaScript bundle, now over 700 kB. Loading divisions lazily is on the roadmap, and is a real refactor because `LINES` is used synchronously everywhere.
- Saves refer to lines by id, so lines can be added anywhere in a division.
