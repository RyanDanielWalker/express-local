import { expect, test, type Page } from "@playwright/test";
import { LINES } from "../src/data";

/**
 * Rides through the production build, the way a player does it: board a line
 * on Local, answer every question, solve the last stop, reach the results
 * screen, ride again, then move the save code into a fresh browser.
 *
 * The test reads the right answers from the content itself, so it keeps
 * working whichever questions and puzzle the ride happens to pick.
 */

const line = LINES.find((l) => l.division === "react" && l.kind === "quiz")!;

/** Copy as the page shows it: `code` and **bold** markers are formatting, not text. */
const plain = (text: string) =>
  text.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");

/** Fail the test on anything the browser logs as an error. */
function watchConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

const stop = (page: Page, cleared: number) =>
  page.getByRole("button", {
    name: `${line.name}, ${cleared} of 3 tiers cleared`,
  });

async function answerQuestions(page: Page) {
  for (;;) {
    const card = page.locator(".qcard");
    const asked = await card.locator(".q").textContent();
    const code = (await card.locator("pre.code").count())
      ? await card.locator("pre.code").textContent()
      : undefined;
    const q = line.questions!.find(
      (x) => plain(x.q) === asked && x.code === code,
    );
    expect(q, `question on screen not found in ${line.id}`).toBeDefined();

    await card
      .locator(".opts")
      .getByRole("button", { name: plain(q!.a), exact: true })
      .click();
    await expect(card.locator(".why b")).toHaveText("Right");

    const next = card.locator(".decide button");
    const label = await next.textContent();
    await next.click();
    if (label !== "Continue") return;
  }
}

/** Solve the last stop, whichever kind it is, and say which one it was. */
async function solvePuzzle(page: Page): Promise<"sort" | "flow"> {
  const card = page.locator(".qcard");
  await expect(card.locator(".eyebrow")).toHaveText("Last stop");
  const title = await card.locator(".scenario").textContent();

  const sort = line.sorts?.find((s) => plain(s.title) === title);
  if (sort) {
    // The highlighted card moves on by itself after each right drop.
    while (await card.locator(".tray button").count()) {
      const name = await card
        .locator('.tray button[aria-pressed="true"]')
        .textContent();
      const item = sort.items.find((i) => i.name === name)!;
      await card
        .locator(".buckets > button")
        .nth(sort.buckets.indexOf(item.bucket))
        .click();
    }
  } else {
    const flow = line.flows?.find((f) => plain(f.title) === title);
    expect(flow, `puzzle "${title}" not found in ${line.id}`).toBeDefined();
    for (const step of flow!.steps.slice(flow!.start ?? 0)) {
      await card
        .locator(".steps")
        .getByRole("button", { name: step, exact: true })
        .click();
    }
  }
  await card.getByRole("button", { name: "See how you did" }).click();
  return sort ? "sort" : "flow";
}

/** Answer everything, solve the last stop, and check the results screen. */
async function ride(page: Page) {
  await answerQuestions(page);
  const puzzle = await solvePuzzle(page);

  const result = page.locator(".result");
  await expect(result.locator("> .eyebrow")).toHaveText(
    `Arrived · ${line.topic} · Local`,
  );
  await expect(
    result.getByRole("heading", { level: 2, name: "Perfect run" }),
  ).toBeVisible();
  return puzzle;
}

test("ride a line twice on Local, then carry the save to a new browser", async ({
  page,
  browser,
}) => {
  const errors = watchConsole(page);
  // Phone width first: on a short page the browser lands at the top anyway,
  // so only a phone shows whether boarding scrolls the ride into view.
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/");

  await stop(page, 0).click();
  await expect(page.getByRole("heading", { name: line.name })).toBeVisible();
  const boardButton = page.getByRole("button", { name: "Board: Local" });
  await boardButton.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await boardButton.click();

  // Riding gives the ride the page: the map and badges collapse, the ride
  // starts at the top of the screen, and one button leads back. Leaving a
  // ride costs nothing, so board again after.
  await expect(page.locator(".qcard")).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(stop(page, 0)).toBeHidden();
  await expect(page.getByRole("region", { name: "Badges" })).toBeHidden();
  await page.getByRole("button", { name: "Back to the map" }).click();
  await expect(stop(page, 0)).toBeVisible();
  await expect(page.getByRole("region", { name: "Badges" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: "Board: Local" }).click();

  const first = await ride(page);
  await expect(stop(page, 1)).toBeVisible();

  // Puzzles rotate from ride to ride. This line has one flow and one sort on
  // Local, so two rides run both kinds of puzzle.
  await page.getByRole("button", { name: "Ride again" }).click();
  const second = await ride(page);
  expect([first, second].sort()).toEqual(["flow", "sort"]);

  await expect(stop(page, 1)).toBeVisible();
  const xp = await page.locator("header .xp").textContent();

  await page.getByRole("button", { name: "Back up progress" }).click();
  const code = await page.locator("#save-out").inputValue();
  expect(code).toMatch(/^EL1\./);

  // A new context is a separate browser profile, with its own localStorage.
  const other = await (await browser.newContext()).newPage();
  const otherErrors = watchConsole(other);
  await other.goto("/");
  await expect(stop(other, 0)).toBeVisible();

  await other.getByRole("button", { name: "Restore progress" }).click();
  await other.locator("#save-in").fill(code);
  other.once("dialog", (d) => d.accept());
  await other.getByRole("button", { name: "Restore", exact: true }).click();

  await expect(other.getByRole("status")).toHaveText(
    `Imported. You're at ${xp}.`,
  );
  await expect(stop(other, 1)).toBeVisible();
  await expect(other.locator("header .xp")).toHaveText(xp!);

  expect(errors).toEqual([]);
  expect(otherErrors).toEqual([]);
});
