import { expect, test, type Page } from "@playwright/test";
import { LINES } from "../src/data";
import { emptySave, STORAGE_KEY } from "../src/engine/save";
import { qid } from "../src/engine/questions";
import type { SaveData } from "../src/engine/types";

/**
 * Takes the README's screenshots and the clip its GIF is made from, from the
 * production build. Not a test: `npm run screenshots` runs it, then turns the
 * clip into `docs/ride.gif` with ffmpeg. Rerun it when a screen changes.
 */

const DAY = 24 * 60 * 60 * 1000;
const line = LINES.find((l) => l.id === "render")!;

/** Copy as the page shows it: `code` and **bold** markers are formatting, not text. */
const plain = (text: string) =>
  text.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");

/**
 * A save a few weeks in, so the Today band has something to say: React and
 * NestJS lines cleared at different tiers, one review overdue, and a few
 * questions missed before.
 */
function weeksIn(): SaveData {
  const now = Date.now();
  const save = emptySave();
  const cleared = (tier: 1 | 2 | 3, box: number, due: number) => ({
    cleared: true,
    box,
    due: now + due * DAY,
    trips: tier + box,
    tier,
    best: {},
  });
  save.levels = {
    render: cleared(2, 2, 3),
    effect: cleared(1, 1, -1),
    state: cleared(1, 0, 1),
    life: cleared(3, 3, 9),
    di: cleared(2, 2, 5),
    route: cleared(1, 1, 2),
    narrow: cleared(1, 0, 1),
  };
  const effect = LINES.find((l) => l.id === "effect")!;
  for (const q of effect.questions!.slice(0, 3))
    save.questions[qid(effect.id, q)] = {
      seen: 2,
      missed: 1,
      last: now - DAY,
    };
  save.xp = 2350;
  save.stats = { reviews: 6, trips: 14 };
  save.streak = {
    count: 5,
    last: new Date(now - DAY).toISOString().slice(0, 10),
  };
  return save;
}

async function load(page: Page, save: SaveData) {
  await page.goto("/");
  await page.evaluate(
    ([key, value]) =>
      value ? localStorage.setItem(key, value) : localStorage.clear(),
    [STORAGE_KEY, save && JSON.stringify(save)] as const,
  );
  await page.reload();
  await expect(page.getByRole("region", { name: "Today" })).toBeVisible();
}

/** The question on screen, looked up in the line's data. */
async function current(page: Page) {
  const card = page.locator(".qcard");
  const asked = await card.locator(".q").textContent();
  const code = (await card.locator("pre.code").count())
    ? await card.locator("pre.code").textContent()
    : undefined;
  return line.questions!.find((x) => plain(x.q) === asked && x.code === code)!;
}

const option = (page: Page, text: string) =>
  page
    .locator(".qcard .opts")
    .getByRole("button", { name: plain(text), exact: true });

/** Board Repaint Line on Local from the map, whichever tier it offers first. */
async function board(page: Page) {
  await page
    .getByRole("button", { name: /^Repaint Line, \d of 3 tiers cleared$/ })
    .click();
  await page.getByRole("button", { name: /^Local\b/ }).click();
  await page.getByRole("button", { name: "Board: Local" }).click();
  await expect(page.locator(".qcard")).toBeVisible();
}

/** Answer right until the last stop shows. */
async function toLastStop(page: Page) {
  while (
    !(await page.locator(".qcard .eyebrow").textContent())?.includes(
      "Last stop",
    )
  ) {
    await option(page, (await current(page)).a).click();
    await page.locator(".qcard .decide button").click();
  }
}

test.use({ viewport: { width: 1200, height: 820 } });

test("the Today band and the map", async ({ page }) => {
  await load(page, weeksIn());
  await page.screenshot({ path: "docs/today.png" });
});

test("a question, answered", async ({ page }) => {
  await load(page, weeksIn());
  await board(page);
  await option(page, (await current(page)).a).click();
  await expect(page.locator(".qcard .why b")).toHaveText("Right");
  // The whole page, so a question with a code block still shows the line's
  // name above it and the explanation below.
  await page.screenshot({ path: "docs/question.png", fullPage: true });
});

test("both kinds of last stop, one in dark mode", async ({ page }) => {
  await load(page, weeksIn());
  // Puzzles rotate ride by ride, and this line has one of each on Local.
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await board(page);
    await toLastStop(page);
    const card = page.locator(".qcard");
    const title = await card.locator(".scenario").textContent();
    const sort = line.sorts?.find((s) => plain(s.title) === title);
    const flow = line.flows?.find((f) => plain(f.title) === title);
    // One right move at a time, whichever kind of puzzle it is.
    const moves = sort
      ? sort.items.map(() => async () => {
          const name = await card
            .locator('.tray button[aria-pressed="true"]')
            .textContent();
          const item = sort.items.find((x) => x.name === name)!;
          await card
            .locator(".buckets > button")
            .nth(sort.buckets.indexOf(item.bucket))
            .click();
        })
      : flow!.steps
          .slice(flow!.start ?? 0)
          .map(
            (step) => () =>
              card
                .locator(".steps")
                .getByRole("button", { name: step, exact: true })
                .click(),
          );
    // Shoot it half solved, then finish, so the next ride gets the other one.
    const half = Math.ceil(moves.length / 2);
    for (const move of moves.slice(0, half)) await move();
    await page.screenshot({
      path: `docs/${sort ? "sort" : "flow"}-${scheme}.png`,
    });
    for (const move of moves.slice(half)) await move();
    await card.getByRole("button", { name: "See how you did" }).click();
    await page.getByRole("button", { name: "Map", exact: true }).click();
  }
});

test("breadth-first search, mid-ride", async ({ page }) => {
  // The Local is the second algorithm line, so clear the first one.
  const save = emptySave();
  save.levels.sq = { ...weeksIn().levels.render!, tier: 1 };
  await load(page, save);
  await page.emulateMedia({ colorScheme: "dark" });
  await page
    .getByRole("button", { name: /^The Local, \d of 3 tiers cleared$/ })
    .click();
  await page.getByRole("button", { name: "Board: Local" }).click();
  // Fold the explainer away, so the graph fits the shot.
  await page.locator("details[open] > summary").click();
  // Read the graph off its own panel and walk it breadth first, the way the
  // game's traverse() does: neighbors in the order listed.
  const rows = await page
    .locator(".panel", { hasText: "Neighbors of each station" })
    .locator(".mono > div")
    .allTextContents();
  const adj = new Map(
    rows.map((r) => {
      const [k, ns] = r.split(":");
      return [
        k.trim(),
        ns
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ];
    }),
  );
  const order = ["A"];
  for (let i = 0; i < order.length; i++)
    for (const n of adj.get(order[i])!) if (!order.includes(n)) order.push(n);
  for (const s of order.slice(0, 4)) {
    await page
      .getByRole("button", { name: `Station ${s}`, exact: true })
      .click();
  }
  await expect(page.locator(".board .hint")).toContainText(
    order.slice(0, 4).join(" → "),
  );
  await page.screenshot({ path: "docs/bfs-dark.png" });
});

test("the clip for the GIF", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 960, height: 800 },
    recordVideo: {
      dir: "test-results/clip",
      size: { width: 960, height: 800 },
    },
  });
  const page = await context.newPage();
  await load(page, weeksIn());
  const pause = (ms: number) => page.waitForTimeout(ms);

  // Open on the Today band, then glide down to the line.
  await page.evaluate(() => scrollTo({ top: 0 }));
  await pause(2500);
  await page.evaluate(() =>
    document
      .querySelector(".division:has(.dhead [aria-expanded=true])")!
      .scrollIntoView({ behavior: "smooth" }),
  );
  await pause(1500);
  await board(page);
  await pause(1500);
  // One right answer, read for a moment.
  await option(page, (await current(page)).a).click();
  await pause(3200);
  await page.locator(".qcard .decide button").click();
  await pause(1500);
  // One miss: the app says it was a miss, and explains after.
  const q = await current(page);
  const wrong = q.opts.find((o) => o !== q.a)!;
  await option(page, wrong).click();
  await pause(4500);

  await context.close();
  await page.video()!.saveAs("test-results/ride.webm");
});
