import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TodayBand } from "./TodayBand";
import { LINES } from "../data";
import type { TodayItem } from "../engine/today";

const noop = () => {};
const render = (items: TodayItem[]) =>
  renderToStaticMarkup(
    <TodayBand items={items} onLine={noop} onShaky={noop} />,
  );

describe("today band", () => {
  it("names the line or count for every kind of item", () => {
    const html = render([
      { kind: "review", lineIdx: 1, more: 2 },
      { kind: "shaky", count: 14 },
      { kind: "daily", lineIdx: 2 },
      { kind: "next", lineIdx: 3 },
    ]);
    expect(html).toContain(`Review ${LINES[1].name}`);
    expect(html).toContain("2 more lines due");
    expect(html).toContain("14 questions");
    expect(html).toContain("Drill 10 shaky");
    expect(html).toContain(`Ride ${LINES[2].name}`);
    expect(html).toContain(`Start ${LINES[3].name}`);
    expect(html).not.toContain("—");
  });

  it("drills every shaky question when there are ten or fewer", () => {
    expect(render([{ kind: "shaky", count: 3 }])).toContain("Drill 3 shaky");
  });

  it("says so when there is nothing to do", () => {
    expect(render([])).toContain("Nothing due and nothing shaky");
  });
});
