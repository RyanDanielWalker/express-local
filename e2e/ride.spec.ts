import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { LINES } from "../src/data";
import { DIVISIONS } from "../src/engine/questions";

/**
 * Rides through the production build, the way a player does it: board a line
 * on Local, answer every question, solve the last stop, reach the results
 * screen, ride again, then move the save code into a fresh browser.
 *
 * The test reads the right answers from the content itself, so it keeps
 * working whichever questions and puzzle the ride happens to pick.
 */

const line = LINES.find((l) => l.division === "react" && l.kind === "quiz")!;
const division = DIVISIONS.find((d) => d.id === line.division)!.name;
const linePath = `/${line.division}/${line.id}`;

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

/**
 * Accessibility findings, gathered from every screen the test passes through
 * and checked once at the end, so one run lists them all.
 */
const findings: string[] = [];

/**
 * Run axe on the page as it stands: labels, button names, color contrast and
 * the rest of WCAG 2.2 A and AA. Also check nothing is wider than the screen,
 * which at phone width means the player would have to scroll sideways.
 */
async function audit(page: Page, where: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  for (const v of violations)
    for (const n of v.nodes)
      findings.push(`${where}: ${v.id} at ${n.target.join(" ")}`);
  const wider = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (wider > 0) findings.push(`${where}: ${wider}px wider than the screen`);
}

/**
 * A fresh save opens only the first division on the map, so the line's own
 * division has to be opened before its stop shows.
 */
const openDivision = (page: Page) =>
  page
    .getByRole("button", {
      name: new RegExp(`^${division}\\b`),
      expanded: false,
    })
    .click();

const stop = (page: Page, cleared: number) =>
  page.getByRole("button", {
    name: `${line.name}, ${cleared} of 3 tiers cleared`,
  });

async function answerQuestions(page: Page, where: string) {
  for (let i = 0; ; i++) {
    const card = page.locator(".qcard");
    const asked = await card.locator(".q").textContent();
    const code = (await card.locator("pre.code").count())
      ? await card.locator("pre.code").textContent()
      : undefined;
    const q = line.questions!.find(
      (x) => plain(x.q) === asked && x.code === code,
    );
    expect(q, `question on screen not found in ${line.id}`).toBeDefined();
    if (i === 0) await audit(page, `${where}, a question`);

    await card
      .locator(".opts")
      .getByRole("button", { name: plain(q!.a), exact: true })
      .click();
    await expect(card.locator(".why b")).toHaveText("Right");
    if (i === 0) await audit(page, `${where}, an answer`);

    const next = card.locator(".decide button");
    const label = await next.textContent();
    await next.click();
    if (label !== "Continue") return;
  }
}

/** Solve the last stop, whichever kind it is, and say which one it was. */
async function solvePuzzle(
  page: Page,
  where: string,
): Promise<"sort" | "flow"> {
  const card = page.locator(".qcard");
  await expect(card.locator(".eyebrow")).toHaveText("Last stop");
  await audit(page, `${where}, the last stop`);
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
  await audit(page, `${where}, the last stop solved`);
  await card.getByRole("button", { name: "See how you did" }).click();
  return sort ? "sort" : "flow";
}

/** Answer everything, solve the last stop, and check the results screen. */
async function ride(page: Page, where: string) {
  await answerQuestions(page, where);
  const puzzle = await solvePuzzle(page, where);

  const result = page.locator(".result");
  await expect(result.locator("> .eyebrow")).toHaveText(
    `Arrived · ${line.topic} · Local`,
  );
  await expect(
    result.getByRole("heading", { level: 2, name: "Perfect run" }),
  ).toBeVisible();
  await audit(page, `${where}, the results`);
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

  await expect(page.getByRole("region", { name: "Today" })).toBeVisible();
  await expect(stop(page, 0)).toBeHidden();
  await audit(page, "Phone, the map");
  await openDivision(page);
  await stop(page, 0).click();
  await expect(
    page.getByRole("heading", { level: 2, name: line.name }),
  ).toBeVisible();
  await expect(page).toHaveURL(linePath);
  await audit(page, "Phone, the line");
  const boardButton = page.getByRole("button", { name: "Board: Local" });
  await boardButton.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await boardButton.click();

  // Riding gives the ride the page: the map and badges collapse, the ride
  // starts at the top of the screen, and one button leads back. Leaving a
  // ride costs nothing, so board again after.
  await expect(page.locator(".qcard")).toBeVisible();
  await expect(page).toHaveURL(`${linePath}/ride`);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(stop(page, 0)).toBeHidden();
  await expect(page.getByRole("region", { name: "Badges" })).toBeHidden();
  await page.getByRole("button", { name: "Back to the map" }).click();
  await expect(stop(page, 0)).toBeVisible();
  await expect(page.getByRole("region", { name: "Badges" })).toBeVisible();
  await expect(page).toHaveURL(linePath);

  // The browser's Back leaves a ride for its line, not the app. The ride
  // left behind is gone, so Forward shows the line too.
  await boardButton.click();
  await expect(page.locator(".qcard")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".qcard")).toBeHidden();
  await expect(boardButton).toBeVisible();
  await expect(page).toHaveURL(linePath);
  await page.goForward();
  await expect(page).toHaveURL(linePath);
  await expect(boardButton).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Board: Local" }).click();

  // The first ride is at phone width in light mode, the second on a desktop
  // screen in dark mode, so the checks along the way see both.
  const first = await ride(page, "Phone");
  await expect(stop(page, 1)).toBeVisible();

  // Puzzles rotate from ride to ride. This line has one flow and one sort on
  // Local, so two rides run both kinds of puzzle.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "dark" });
  await audit(page, "Dark, the results");
  await page.getByRole("button", { name: "Ride again" }).click();
  const second = await ride(page, "Dark");
  expect([first, second].sort()).toEqual(["flow", "sort"]);

  await expect(stop(page, 1)).toBeVisible();
  const xp = await page.locator("header .xp").textContent();

  await page.getByRole("button", { name: "Back up progress" }).click();
  const code = await page.locator("#save-out").inputValue();
  expect(code).toMatch(/^EL1\./);
  await audit(page, "Dark, the save code");

  // A new context is a separate browser profile, with its own localStorage.
  const other = await (await browser.newContext()).newPage();
  const otherErrors = watchConsole(other);
  // A line's URL opens that line, even in a browser that has never seen it.
  await other.goto(linePath);
  await expect(
    other.getByRole("heading", { level: 2, name: line.name }),
  ).toBeVisible();
  await expect(stop(other, 0)).toBeVisible();

  await other.getByRole("button", { name: "Restore progress" }).click();
  await audit(other, "New browser, restoring");
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
  expect(findings).toEqual([]);
});
