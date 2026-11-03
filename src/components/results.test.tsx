import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Results } from "./Results";
import { Derailed } from "./Derailed";
import { LINES } from "../data";
import { finishCram, finishRehearsal, finishTrip } from "../engine/progression";
import { emptySave } from "../engine/save";

const ride = {
  tier: 1 as const,
  rideXp: 60,
  mistakes: 1,
  time: 72,
  answers: [],
};
const noop = () => {};
const props = {
  ride,
  nextName: "Next Line",
  onAgain: noop,
  onNext: noop,
  onTier: noop,
  onMap: noop,
};

describe("results screen", () => {
  it("renders for every line without blowing up", () => {
    for (const line of LINES) {
      const result = finishTrip(emptySave(), {
        lineIdx: LINES.indexOf(line),
        quizOk: true,
        ...ride,
      });
      const html = renderToStaticMarkup(
        <Results {...props} line={line} result={result} />,
      );
      expect(html, line.id).toContain("Total");
    }
  });

  it("renders a cram drill result without a line to review", () => {
    const result = finishCram(emptySave(), { right: 9, asked: 12, time: 140 });
    const cramLine = {
      ...LINES[0],
      id: "cram" as (typeof LINES)[number]["id"],
      bigO: undefined,
      name: "Cram Drill",
    };
    const html = renderToStaticMarkup(
      <Results {...props} mode="cram" line={cramLine} result={result} />,
    );
    expect(html).toContain("do not change line progress");
    expect(html).not.toContain("Next review in");
  });

  it("renders a rehearsal result with its own wording", () => {
    const result = finishRehearsal(emptySave(), {
      lineId: "di",
      nailed: ["a"],
      shaky: ["b"],
    });
    const line = LINES.find((l) => l.id === "di")!;
    const html = renderToStaticMarkup(
      <Results {...props} mode="rehearsal" line={line} result={result} />,
    );
    expect(html).toContain("Out loud");
    expect(html).toContain("comes back first next time");
    expect(html).not.toContain("Next review in");
  });

  it("renders the out-of-hearts screen for every line", () => {
    for (const line of LINES) {
      expect(
        renderToStaticMarkup(
          <Derailed line={line} onAgain={noop} onMap={noop} />,
        ),
        line.id,
      ).toContain("Service suspended");
    }
  });

  // An answer like `string[]` is code. The recap shows it as code, not with
  // its backticks.
  it("shows a missed answer's code as code, without the backticks", () => {
    const question = {
      t: 1 as const,
      q: "What is the type of `kv`?",
      opts: ["`[string, number]`", "`string[]`"],
      a: "`[string, number]`",
      why: "A tuple.",
    };
    const derailed = renderToStaticMarkup(
      <Derailed
        line={LINES[0]}
        missed={[question]}
        onAgain={noop}
        onMap={noop}
      />,
    );
    const result = finishTrip(emptySave(), {
      lineIdx: 0,
      quizOk: true,
      ...ride,
    });
    const results = renderToStaticMarkup(
      <Results
        {...props}
        ride={{ ...ride, answers: [{ question, correct: false }] }}
        line={LINES[0]}
        result={result}
      />,
    );
    for (const html of [derailed, results]) {
      expect(html).toContain('<code class="solo">[string, number]</code>');
      expect(html).not.toContain("`[string, number]`");
    }
  });
});
