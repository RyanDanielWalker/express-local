import { describe, expect, it } from "vitest";
import { LINES } from "../data";
import type { Line } from "../engine/types";
import { contrast, isLarge, mix, needed } from "../lib/contrast";
// Vitest lets this file through as text (see `css` in vite.config.ts).
import css from "./app.css?raw";

/**
 * Every rule in app.css that puts text on a background, checked against
 * WCAG AA in light and dark. The colors come from the variables at the top
 * of the file, so changing a variable re-checks every rule that uses it.
 *
 * A rule that sets a text color and no background is checked on every
 * surface text sits on. A rule that sets a background and no text color is
 * checked with the page's ink. `var(--c)` is a line's color, so a rule drawn
 * in it is checked for every line, unless LINE_RULES says which lines use it.
 */

/** Rules drawn in a line's color that only some lines use, or that are large text. */
const LINE_RULES: Record<
  string,
  { lines?: (l: Line) => boolean; large?: string; background?: string }
> = {
  ".bullet": {
    lines: (l) => !l.darkText,
    large: "every bullet size is 19px or more, in a 900 weight (checked below)",
  },
  ".bullet.dark-text": {
    lines: (l) => !!l.darkText,
    large: "every bullet size is 19px or more, in a 900 weight (checked below)",
    background: "var(--c)", // set by .bullet
  },
  ".chip.out": { lines: (l) => l.id === "merge" || l.id === "sq" },
  ".bucket .k.hit": { lines: (l) => l.id === "hash" },
  ".bucket .k": { lines: (l) => l.id === "hash" },
  ".target span": {
    lines: (l) => l.id === "two",
    large: "inherits 30px in a 900 weight from .target",
  },
};

/** Rules whose color carries no text, so no text contrast applies. */
const NO_TEXT: Record<string, string> = {
  ".hearts span.gone":
    "a heart already lost, faded on purpose; the count is in the aria-label",
  ".say li::marker": "a list bullet",
  ".recap li::marker": "a list bullet",
};

/** Bars, pips and swatches: `i` elements and ::before boxes, which hold no text. */
const isSwatch = (selector: string) =>
  /(^|\s)i([.:]|$)|::before$/.test(selector.split(/\s+/).slice(-1)[0]);

type Theme = Record<string, string>;

function tokens(block: string): Theme {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{3,6})\b/gi)].map((m) => [
      m[1],
      long(m[2]),
    ]),
  );
}

/** `#fff` as `#ffffff`. */
const long = (hex: string) =>
  hex.length === 4
    ? "#" + [...hex.slice(1)].map((c) => c + c).join("")
    : hex.toLowerCase();

const blockAfter = (sheet: string, head: string) => {
  const start = sheet.indexOf(head);
  if (start < 0) throw new Error(`no ${head} block in app.css`);
  return sheet.slice(start, sheet.indexOf("}", start));
};

function themes(sheet: string) {
  const light = tokens(blockAfter(sheet, ":root {"));
  const dark = {
    ...light,
    ...tokens(blockAfter(sheet, ':root[data-theme="dark"] {')),
  };
  return { light, dark };
}

type Rule = { selector: string; body: string };

function rules(sheet: string): Rule[] {
  const flat = sheet.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim().replace(/\s+/g, " "),
    body: m[2],
  }));
}

const decl = (body: string, prop: string) =>
  new RegExp(`(?:^|;)\\s*${prop}:\\s*([^;]+)`).exec(body)?.[1].trim();

/** A CSS color value as hex, or null when it names no color (inherit, none). */
function resolve(value: string, theme: Theme, c: string): string | null {
  const m = /^color-mix\(in srgb, (.+) (\d+)%, (.+)\)$/.exec(value);
  if (m) {
    const [a, b] = [resolve(m[1], theme, c), resolve(m[3], theme, c)];
    return a && b ? mix(a, Number(m[2]), b) : null;
  }
  const v = /^var\(--([\w-]+)\)$/.exec(value);
  if (v) {
    if (v[1] === "c") return c;
    if (!theme[v[1]]) throw new Error(`no color variable --${v[1]}`);
    return theme[v[1]];
  }
  if (/^#[0-9a-f]{3,6}$/i.test(value)) return long(value);
  return null;
}

/** Every text and background pair in a stylesheet that falls short of AA. */
function audit(sheet: string, lines: Line[] = LINES): string[] {
  const failures: string[] = [];
  for (const [name, theme] of Object.entries(themes(sheet))) {
    const surfaces = ["bg", "panel", "tile", "code"].map((t) => theme[t]);
    for (const { selector, body } of rules(sheet)) {
      if (selector.startsWith(":root") || selector in NO_TEXT) continue;
      const fgValue = decl(body, "color");
      const scope = LINE_RULES[selector];
      const bgValue = decl(body, "background(?:-color)?") ?? scope?.background;
      if (!fgValue && (!bgValue || isSwatch(selector))) continue;

      const usesLine = /var\(--c\)/.test(`${fgValue} ${bgValue}`);
      const drawnIn = usesLine
        ? lines.filter(scope?.lines ?? (() => true))
        : [undefined];
      const size = Number(
        /([\d.]+)px/.exec(decl(body, "font-size") ?? "")?.[1] ?? 16,
      );
      const weight = Number(decl(body, "font-weight") ?? 400);
      const large = !!scope?.large || isLarge(size, weight);

      for (const line of drawnIn) {
        const c = line ? theme[line.color.slice(2)] : "";
        const fg = fgValue ? resolve(fgValue, theme, c) : theme.ink;
        if (!fg) continue;
        const bg = bgValue ? resolve(bgValue, theme, c) : null;
        for (const back of bg ? [bg] : surfaces) {
          const ratio = contrast(fg, back);
          if (ratio < needed(large))
            failures.push(
              `${name} ${selector}${line ? ` (${line.id})` : ""}: ${fg} on ${back} is ${ratio.toFixed(2)}, needs ${needed(large)}`,
            );
        }
      }
    }
  }
  return failures;
}

describe("color contrast", () => {
  it("passes WCAG AA for every rule in app.css, in light and dark", () => {
    expect(audit(css)).toEqual([]);
  });

  it("catches a pair that falls short", () => {
    const bad = `:root { --bg: #ffffff; --panel: #ffffff; --tile: #ffffff; --code: #ffffff; --ink: #000000; --pale: #aaaaaa; }
:root[data-theme="dark"] { --bg: #000000; --panel: #000000; --tile: #000000; --code: #000000; --ink: #ffffff; --pale: #444444; }
.faint { color: var(--pale); }
.plain { color: var(--ink); }`;
    const failures = audit(bad, []);
    // Four surfaces in each theme, and only the faint rule.
    expect(failures).toHaveLength(8);
    expect(failures[0]).toBe(
      "light .faint: #aaaaaa on #ffffff is 2.32, needs 4.5",
    );
    expect(failures[4]).toMatch(/^dark \.faint: #444444 on #000000/);
  });

  it("keeps the two copies of the dark theme the same", () => {
    // Dark mode is written twice: once for the system setting, once for the
    // data-theme switch. A color changed in one copy only would split them.
    const system = tokens(blockAfter(css, ':root:not([data-theme="light"]) {'));
    expect(system).toEqual(
      tokens(blockAfter(css, ':root[data-theme="dark"] {')),
    );
  });

  it("draws every bullet large enough to count as large text", () => {
    // LINE_RULES treats bullets as large text, which needs 3:1, not 4.5:1.
    const sizes = rules(css)
      .filter((r) => r.selector.startsWith(".bullet"))
      .map((r) => decl(r.body, "font-size"))
      .filter((s) => s !== undefined)
      .map((s) => Number(/([\d.]+)px/.exec(s)![1]));
    expect(sizes.length).toBeGreaterThan(0);
    for (const px of sizes) expect(isLarge(px, 900), `${px}px`).toBe(true);
  });

  it("keeps text colors in app.css, where this test can see them", () => {
    const files = import.meta.glob("../**/*.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const inline = Object.entries(files).filter(([, src]) =>
      /\b(color|background):\s*"(#|var\()/.test(src),
    );
    expect(inline.map(([file]) => file)).toEqual([]);
  });
});
