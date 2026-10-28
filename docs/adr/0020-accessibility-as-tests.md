# 0020. Accessibility is checked by tests: axe in the end-to-end test, and contrast from the stylesheet

Status: Accepted (2026-10-28).

## Context

1.0's interface work asks for accessibility checks as tests: inputs with labels, buttons with names, color contrast in light and dark, and a check at phone width (375px). A first measurement found real contrast failures. Dark mode put white letters on bright line colors, as low as 1.7:1 on yellow. Light mode's green for right answers was below 4.5:1 as text. The results stamp drew text in the line's own color, 2:1 for yellow on white.

## Options

For labels and names:

1. **axe-core in the end-to-end test** (`@axe-core/playwright`, a dev dependency only). The standard checker, run on each screen the test passes through. Working out a button's accessible name has real rules, and axe implements them.
2. **A hand-rolled check.** No dependency, but fewer rules and easy to get wrong.

For the contrast failures:

1. **Keep the line colors, fix the text on them.** Dark mode's text on a line color becomes the dark ink. Light mode's green gets a darker shade.
2. **Darken the palette** until white text passes everywhere. Dark mode loses most of its brightness.

## Decision

axe-core, and keep the line colors. Both were Ryan's calls.

The bar is WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for large text (24px, or 18.66px bold).

- `e2e/ride.spec.ts` runs axe on the map, a line, a question, an answer, both puzzle kinds, the results and the save box. The first ride is at 375px in light mode, the second at desktop width in dark mode. At each stop it also checks nothing is wider than the screen. Every finding is gathered and checked once at the end, so one run lists them all.
- `src/styles/contrast.test.ts` reads `app.css` and checks every rule that puts text on a background, in both themes, from the color variables. It runs in `npm test`. axe only sees what is on screen and skips `aria-hidden` text like the bullets, so this test covers what axe cannot.
- Text colors live in `app.css`, not in inline styles, because the contrast test cannot see inline styles. A test enforces that.

`@axe-core/playwright` is pinned to 4.13.0. 4.14.0 was two weeks old when this was written.

## Consequences

- Visible changes: dark-mode bullets and the small white labels on a line color now use dark letters. Light mode's green is a shade darker. The results stamp writes in ink inside a line-colored border. Small bullets went from 18px to 19px, so they count as large text. The paused clock is muted instead of faded.
- Code blocks are keyboard-focusable (`tabIndex={0}`), so a code line too long for a phone can be scrolled without a mouse.
- A new rule drawn in a line's color is checked against every line, unless `LINE_RULES` in the contrast test says which lines use it.
- Not covered: contrast for non-text parts (meter bars, pips, borders, 3:1 under WCAG 1.4.11), and screens the end-to-end test does not visit (the algorithm games, rehearsal, the cram drill). Both are on the roadmap under Parked.
